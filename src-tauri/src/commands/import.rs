use crate::models::transaction::CreateTransactionDto;
use crate::services::auth::AuthState;
use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ExtractedTransaction {
    pub amount: f64,
    pub r#type: String,
    pub description: String,
    pub date: String,
    pub category: Option<String>,
    pub confidence: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub document_type: String,
    pub emitter: Option<String>,
    pub transactions: Vec<ExtractedTransaction>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
    #[serde(rename = "generationConfig")]
    generation_config: GeminiGenerationConfig,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
enum GeminiPart {
    Text {
        text: String,
    },
    InlineData {
        #[serde(rename = "inlineData")]
        inline_data: GeminiInlineData,
    },
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiInlineData {
    #[serde(rename = "mimeType")]
    mime_type: String,
    data: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiGenerationConfig {
    temperature: f64,
    #[serde(rename = "responseMimeType")]
    response_mime_type: String,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Option<Vec<GeminiCandidate>>,
    error: Option<GeminiError>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiCandidateContent,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidateContent {
    parts: Vec<GeminiResponsePart>,
}

#[derive(Debug, Deserialize)]
struct GeminiResponsePart {
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GeminiError {
    message: String,
}

const IMPORT_PROMPT: &str = r#"Analise este documento financeiro (pode ser fatura, recibo, extrato bancário, nota fiscal, boleto, ou qualquer documento com informações financeiras).

Extraia TODAS as transações/itens/lançamentos encontrados e retorne um JSON no formato:
{
  "document_type": "fatura" | "recibo" | "extrato" | "nota_fiscal" | "boleto" | "outro",
  "emitter": "nome da empresa ou pessoa emissora (se identificável)",
  "transactions": [
    {
      "amount": 150.00,
      "type": "expense",
      "description": "descrição clara e específica do item",
      "date": "2026-05-12",
      "category": "categoria sugerida",
      "confidence": 0.95
    }
  ]
}

Regras obrigatórias:
- amount: SEMPRE valor positivo em reais (BRL). Remova R$, pontos de milhar, e converta vírgula para ponto decimal
- type: "expense" para gastos/compras/débitos, "income" para recebimentos/créditos/depósitos
- date: formato ISO YYYY-MM-DD. Se não encontrar data exata no item, use a data do documento
- description: seja específico (ex: "Supermercado Pão de Açúcar" em vez de apenas "compra")
- category: escolha UMA das categorias abaixo conforme o type:
  Para DESPESAS (type=expense): Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Vestuário, Serviços, Assinaturas, Supermercado, Restaurante, Combustível, Farmácia, Pet, Presentes, Viagem, Impostos e Taxas, Seguros, Outros
  Para RECEITAS (type=income): Salário, Freelance, Rendimentos, Aluguel Recebido, Vendas, Bônus, Restituição, Outros
- confidence: sua confiança na extração correta deste item (0.0 a 1.0)
- Se for um extrato com muitas linhas, extraia TODAS as linhas
- Se for uma fatura de cartão, cada compra é uma transação separada
- Retorne APENAS o JSON, sem markdown, sem explicação, sem blocos de código"#;

#[tauri::command]
pub async fn import_document(
    state: State<'_, AuthState>,
    file_path: String,
) -> Result<ImportResult, String> {
    state.require_unlocked()?;

    // 1. Get API key using the internal helper that handles Keyring + DB fallback
    let api_key =
        crate::commands::settings::get_setting_internal(&state, "gemini_api_key".to_string())
            .await?
            .ok_or_else(|| {
                "Chave da API do Gemini não configurada. Vá em Configurações para adicionar."
                    .to_string()
            })?;

    if api_key.trim().is_empty() {
        return Err("Chave da API do Gemini está vazia. Configure em Configurações.".to_string());
    }

    let pool = state.get_pool()?;

    // 2. Read the file
    let file_bytes =
        std::fs::read(&file_path).map_err(|e| format!("Erro ao ler o arquivo: {}", e))?;

    // 3. Determine MIME type
    let mime_type = mime_guess::from_path(&file_path)
        .first()
        .map(|m| m.to_string())
        .unwrap_or_else(|| "application/octet-stream".to_string());

    // Validate supported types
    let supported = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif",
        "application/pdf",
    ];
    if !supported.contains(&mime_type.as_str()) {
        return Err(format!(
            "Tipo de arquivo não suportado: {}. Use imagens (JPG, PNG, WebP) ou PDF.",
            mime_type
        ));
    }

    // 4. Encode to base64
    let b64 = base64::engine::general_purpose::STANDARD.encode(&file_bytes);

    // 5. Build Gemini request
    let request = GeminiRequest {
        contents: vec![GeminiContent {
            parts: vec![
                GeminiPart::InlineData {
                    inline_data: GeminiInlineData {
                        mime_type: mime_type.clone(),
                        data: b64,
                    },
                },
                GeminiPart::Text {
                    text: IMPORT_PROMPT.to_string(),
                },
            ],
        }],
        generation_config: GeminiGenerationConfig {
            temperature: 0.1,
            response_mime_type: "application/json".to_string(),
        },
    };

    // 6. Get selected model from settings (default: gemini-2.5-flash)
    let model_row: Option<(String,)> =
        sqlx::query_as("SELECT value FROM settings WHERE key = 'gemini_model'")
            .fetch_optional(&pool)
            .await
            .map_err(|e| e.to_string())?;

    let model = model_row
        .map(|r| r.0)
        .unwrap_or_else(|| "gemini-2.5-flash".to_string());

    // 7. Call Gemini API
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com a API do Gemini: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_body = response.text().await.unwrap_or_default();
        // Parse the error to get a friendly message
        let api_msg = serde_json::from_str::<serde_json::Value>(&error_body)
            .ok()
            .and_then(|v| v["error"]["message"].as_str().map(|s| s.to_string()))
            .unwrap_or_else(|| error_body.chars().take(300).collect());

        return Err(format!(
            "Erro da API do Gemini ({}): {}",
            status.as_u16(),
            api_msg
        ));
    }

    let gemini_response: GeminiResponse = response
        .json()
        .await
        .map_err(|e| format!("Erro ao processar resposta da API: {}", e))?;

    // Check for API-level errors
    if let Some(err) = gemini_response.error {
        return Err(format!("Erro da API do Gemini: {}", err.message));
    }

    // 7. Extract text from response
    let text = gemini_response
        .candidates
        .as_ref()
        .and_then(|c| c.first())
        .and_then(|c| c.content.parts.first())
        .and_then(|p| p.text.as_ref())
        .ok_or_else(|| {
            "A API não retornou nenhum resultado. Tente com outro documento.".to_string()
        })?;

    // 8. Parse JSON response
    let result: ImportResult = serde_json::from_str(text).map_err(|e| {
        format!(
            "Erro ao interpretar resposta da IA: {}. Resposta: {}",
            e,
            &text[..text.len().min(200)]
        )
    })?;

    if result.transactions.is_empty() {
        return Err("Nenhuma transação encontrada no documento. Verifique se o arquivo é um documento financeiro legível.".to_string());
    }

    Ok(result)
}

#[tauri::command]
pub async fn create_transactions_batch(
    state: State<'_, AuthState>,
    transactions: Vec<CreateTransactionDto>,
) -> Result<usize, String> {
    state.require_unlocked()?;
    let pool = state.get_pool()?;

    let mut db_tx = pool.begin().await.map_err(|e| e.to_string())?;
    let count = transactions.len();

    for data in &transactions {
        let id = Uuid::new_v4().to_string();

        sqlx::query(
            "INSERT INTO transactions (id, account_id, category_id, amount, type, description, date, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(&data.account_id)
        .bind(&data.category_id)
        .bind(data.amount)
        .bind(&data.r#type)
        .bind(&data.description)
        .bind(&data.date)
        .bind(&data.tags)
        .execute(&mut *db_tx)
        .await
        .map_err(|e| e.to_string())?;

        // Update account balance
        let amount_diff = if data.r#type == "expense" {
            -data.amount
        } else {
            data.amount
        };
        sqlx::query("UPDATE accounts SET balance = balance + ? WHERE id = ?")
            .bind(amount_diff)
            .bind(&data.account_id)
            .execute(&mut *db_tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    db_tx.commit().await.map_err(|e| e.to_string())?;

    Ok(count)
}

#[tauri::command]
pub async fn import_ofx(
    state: State<'_, AuthState>,
    file_path: String,
) -> Result<ImportResult, String> {
    state.require_unlocked()?;

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Erro ao ler o arquivo OFX/QIF: {}", e))?;

    let mut transactions = Vec::new();

    if file_path.to_lowercase().ends_with(".qif") {
        let mut current_tx = None;
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with('^') {
                if let Some(tx) = current_tx.take() {
                    transactions.push(tx);
                }
            } else if line.starts_with('D') && line.len() > 1 {
                // Typical QIF date format is DMM/DD/YYYY or DMM/DD/YY
                // We do a simple dump
                let mut date_str = line[1..].to_string();
                let parts: Vec<&str> = date_str.split('/').collect();
                if parts.len() == 3 {
                    let mut y = parts[2].to_string();
                    if y.len() == 2 {
                        y = format!("20{}", y);
                    }
                    date_str = format!("{}-{:0>2}-{:0>2}", y, parts[0], parts[1]);
                } else if date_str.len() >= 10 { // e.g. 2026-05-12
                     // keep as is if it has length
                } else {
                    date_str = "2026-01-01".to_string(); // fallback
                }

                if current_tx.is_none() {
                    current_tx = Some(ExtractedTransaction {
                        amount: 0.0,
                        r#type: "expense".to_string(),
                        description: "".to_string(),
                        date: date_str,
                        category: None,
                        confidence: 1.0,
                    });
                } else {
                    current_tx.as_mut().unwrap().date = date_str;
                }
            } else if line.starts_with('T') && line.len() > 1 {
                if let Some(ref mut tx) = current_tx {
                    let clean_amt = line[1..].replace(",", "");
                    if let Ok(amt) = clean_amt.parse::<f64>() {
                        tx.amount = amt.abs();
                        tx.r#type = if amt < 0.0 {
                            "expense".to_string()
                        } else {
                            "income".to_string()
                        };
                    }
                }
            } else if line.starts_with('P') || line.starts_with('M') {
                if line.len() > 1 {
                    if let Some(ref mut tx) = current_tx {
                        tx.description = line[1..].to_string();
                    }
                }
            }
        }
    } else {
        let mut in_txn = false;
        let mut amt: f64 = 0.0;
        let mut desc = String::new();
        let mut date = String::new();

        for line in content.lines() {
            let line = line.trim();
            if line.contains("<STMTTRN>") {
                in_txn = true;
                amt = 0.0;
                desc = String::new();
                date = String::new();
            } else if line.contains("</STMTTRN>") {
                if in_txn {
                    let formatted_date = if date.len() >= 8 {
                        format!("{}-{}-{}", &date[0..4], &date[4..6], &date[6..8])
                    } else {
                        "2026-01-01".to_string() // fallback
                    };

                    transactions.push(ExtractedTransaction {
                        amount: amt.abs(),
                        r#type: if amt < 0.0 {
                            "expense".to_string()
                        } else {
                            "income".to_string()
                        },
                        description: if desc.is_empty() {
                            "Transação OFX".to_string()
                        } else {
                            desc.clone()
                        },
                        date: formatted_date,
                        category: None,
                        confidence: 1.0,
                    });
                }
                in_txn = false;
            } else if in_txn {
                if line.starts_with("<TRNAMT>") {
                    let val_str = line.replace("<TRNAMT>", "").replace("</TRNAMT>", "");
                    if let Ok(val) = val_str.trim().parse::<f64>() {
                        amt = val;
                    }
                } else if line.starts_with("<DTPOSTED>") {
                    let val_str = line.replace("<DTPOSTED>", "").replace("</DTPOSTED>", "");
                    date = val_str.trim().to_string();
                } else if line.starts_with("<MEMO>") {
                    let val_str = line.replace("<MEMO>", "").replace("</MEMO>", "");
                    desc = val_str.trim().to_string();
                } else if line.starts_with("<NAME>") && desc.is_empty() {
                    let val_str = line.replace("<NAME>", "").replace("</NAME>", "");
                    desc = val_str.trim().to_string();
                }
            }
        }
    }

    if transactions.is_empty() {
        return Err("Nenhuma transação encontrada no arquivo OFX/QIF.".to_string());
    }

    Ok(ImportResult {
        document_type: "ofx".to_string(),
        emitter: None,
        transactions,
    })
}
