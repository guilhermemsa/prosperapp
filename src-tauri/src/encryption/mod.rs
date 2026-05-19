#![allow(dead_code)]

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2, PasswordHash, PasswordVerifier,
};
use keyring::Entry;

pub struct EncryptionService;

impl EncryptionService {
    pub fn hash_password(password: &str) -> anyhow::Result<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))?
            .to_string();
        Ok(password_hash)
    }

    pub fn verify_password(password: &str, hash: &str) -> bool {
        let Ok(parsed_hash) = PasswordHash::new(hash) else {
            return false;
        };
        Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok()
    }

    pub fn save_to_keyring(service: &str, user: &str, secret: &str) -> anyhow::Result<()> {
        let entry = Entry::new(service, user)?;
        entry.set_password(secret)?;
        Ok(())
    }

    pub fn get_from_keyring(service: &str, user: &str) -> anyhow::Result<String> {
        let entry = Entry::new(service, user)?;
        let password = entry.get_password()?;
        Ok(password)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_and_verify_password() {
        let password = "test_password";
        let hash = EncryptionService::hash_password(password).unwrap();
        assert!(EncryptionService::verify_password(password, &hash));
        assert!(!EncryptionService::verify_password("wrong_password", &hash));
    }
}
