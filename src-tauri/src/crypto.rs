use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce
};
use base64::{Engine as _, engine::general_purpose};
use rand::Rng;
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use std::sync::Mutex;

// 全局密钥缓存，用于存储解密后的主密钥
lazy_static::lazy_static! {
    static ref KEY_CACHE: Mutex<HashMap<String, Vec<u8>>> = Mutex::new(HashMap::new());
}

pub struct CryptoService;

#[allow(dead_code)]
impl CryptoService {
    // 从主密码派生加密密钥
    pub fn derive_key_from_password(master_password: &str, salt: &[u8]) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(master_password.as_bytes());
        hasher.update(salt);
        hasher.finalize().to_vec()
    }
    
    // 生成随机盐值
    #[allow(dead_code)]
    pub fn generate_salt() -> Vec<u8> {
        let mut salt = [0u8; 16];
        OsRng.fill(&mut salt);
        salt.to_vec()
    }
    
    // 生成随机nonce
    #[allow(dead_code)]
    pub fn generate_nonce() -> Vec<u8> {
        let mut nonce = [0u8; 12];
        OsRng.fill(&mut nonce);
        nonce.to_vec()
    }
    
    // 验证主密码（通过尝试解密一个测试字符串）
    #[allow(dead_code)]
    pub fn verify_master_password(master_password: &str, salt: &[u8], test_encrypted: &str) -> Result<bool, String> {
        let key = Self::derive_key_from_password(master_password, salt);
        let test_result = Self::decrypt_with_key(&key, test_encrypted);
        Ok(test_result.is_ok())
    }
    
    // 使用密钥加密数据
    pub fn encrypt_with_key(key: &[u8], plaintext: &str) -> Result<String, String> {
        if key.len() != 32 {
            return Err("Invalid key length. Expected 32 bytes for AES-256".to_string());
        }
        
        let key = Key::<Aes256Gcm>::from_slice(key);
        let cipher = Aes256Gcm::new(key);
        
        let nonce_bytes = Self::generate_nonce();
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;
        
        // 将nonce和密文拼接在一起，然后base64编码
        let mut result = Vec::new();
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);
        
        Ok(general_purpose::STANDARD.encode(result))
    }
    
    // 使用密钥解密数据
    pub fn decrypt_with_key(key: &[u8], ciphertext_base64: &str) -> Result<String, String> {
        if key.len() != 32 {
            return Err("Invalid key length. Expected 32 bytes for AES-256".to_string());
        }
        
        let combined_data = general_purpose::STANDARD.decode(ciphertext_base64)
            .map_err(|e| format!("Base64 decode failed: {}", e))?;
        
        if combined_data.len() < 12 {
            return Err("Invalid ciphertext: too short".to_string());
        }
        
        let (nonce_bytes, ciphertext) = combined_data.split_at(12);
        let key = Key::<Aes256Gcm>::from_slice(key);
        let cipher = Aes256Gcm::new(key);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        let plaintext = cipher.decrypt(nonce, ciphertext)
            .map_err(|e| format!("Decryption failed: {}", e))?;
        
        String::from_utf8(plaintext)
            .map_err(|e| format!("UTF-8 conversion failed: {}", e))
    }
    
    // 使用主密码加密
    pub fn encrypt_with_master_password(master_password: &str, salt: &[u8], plaintext: &str) -> Result<String, String> {
        let key = Self::derive_key_from_password(master_password, salt);
        Self::encrypt_with_key(&key, plaintext)
    }
    
    // 使用主密码解密
    pub fn decrypt_with_master_password(master_password: &str, salt: &[u8], ciphertext: &str) -> Result<String, String> {
        let key = Self::derive_key_from_password(master_password, salt);
        Self::decrypt_with_key(&key, ciphertext)
    }
    
    // 缓存主密钥（会话期间有效）
    pub fn cache_master_key(session_id: &str, master_password: &str, salt: &[u8]) -> Result<(), String> {
        let key = Self::derive_key_from_password(master_password, salt);
        let mut cache = KEY_CACHE.lock().map_err(|e| format!("Lock error: {}", e))?;
        cache.insert(session_id.to_string(), key);
        Ok(())
    }
    
    // 从缓存获取主密钥
    pub fn get_cached_key(session_id: &str) -> Option<Vec<u8>> {
        let cache = KEY_CACHE.lock().ok()?;
        cache.get(session_id).cloned()
    }
    
    // 清除缓存的密钥
    pub fn clear_cached_key(session_id: &str) -> Result<(), String> {
        let mut cache = KEY_CACHE.lock().map_err(|e| format!("Lock error: {}", e))?;
        cache.remove(session_id);
        Ok(())
    }
    
    // 清除所有缓存密钥
    #[allow(dead_code)]
    pub fn clear_all_cached_keys() -> Result<(), String> {
        let mut cache = KEY_CACHE.lock().map_err(|e| format!("Lock error: {}", e))?;
        cache.clear();
        Ok(())
    }
    
    // 使用缓存密钥加密
    pub fn encrypt_with_cached_key(session_id: &str, plaintext: &str) -> Result<String, String> {
        let key = Self::get_cached_key(session_id)
            .ok_or_else(|| "No cached key found for session".to_string())?;
        Self::encrypt_with_key(&key, plaintext)
    }
    
    // 使用缓存密钥解密
    pub fn decrypt_with_cached_key(session_id: &str, ciphertext: &str) -> Result<String, String> {
        let key = Self::get_cached_key(session_id)
            .ok_or_else(|| "No cached key found for session".to_string())?;
        Self::decrypt_with_key(&key, ciphertext)
    }
    
    // 生成安全的随机密码
    pub fn generate_password(length: usize, include_uppercase: bool, include_lowercase: bool, include_numbers: bool, include_symbols: bool) -> String {
        let mut charset = String::new();
        
        if include_lowercase {
            charset.push_str("abcdefghijklmnopqrstuvwxyz");
        }
        if include_uppercase {
            charset.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        }
        if include_numbers {
            charset.push_str("0123456789");
        }
        if include_symbols {
            charset.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
        }
        
        if charset.is_empty() {
            charset.push_str("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
        }
        
        let charset_bytes = charset.as_bytes();
        let mut rng = rand::thread_rng();
        
        (0..length)
            .map(|_| {
                let idx = rng.gen_range(0..charset_bytes.len());
                charset_bytes[idx] as char
            })
            .collect()
    }
    
    // 检查密码强度（返回0-100的分数）
    pub fn check_password_strength(password: &str) -> u8 {
        let mut score = 0u8;
        let length = password.len();
        
        // 长度评分
        if length >= 8 {
            score += 25;
        }
        if length >= 12 {
            score += 10;
        }
        if length >= 16 {
            score += 5;
        }
        
        // 字符类型评分
        let has_lowercase = password.chars().any(|c| c.is_ascii_lowercase());
        let has_uppercase = password.chars().any(|c| c.is_ascii_uppercase());
        let has_numbers = password.chars().any(|c| c.is_ascii_digit());
        let has_symbols = password.chars().any(|c| !c.is_ascii_alphanumeric());
        
        if has_lowercase {
            score += 15;
        }
        if has_uppercase {
            score += 15;
        }
        if has_numbers {
            score += 15;
        }
        if has_symbols {
            score += 15;
        }
        
        score.min(100)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encryption_decryption() {
        let master_password = "test_password_123";
        let salt = CryptoService::generate_salt();
        let plaintext = "Hello, World!";
        
        let encrypted = CryptoService::encrypt_with_master_password(master_password, &salt, plaintext).unwrap();
        let decrypted = CryptoService::decrypt_with_master_password(master_password, &salt, &encrypted).unwrap();
        
        assert_eq!(plaintext, decrypted);
    }
    
    #[test]
    fn test_password_generation() {
        let password = CryptoService::generate_password(16, true, true, true, true);
        assert_eq!(password.len(), 16);
    }
    
    #[test]
    fn test_password_strength() {
        assert!(CryptoService::check_password_strength("weak") < 50);
        assert!(CryptoService::check_password_strength("StrongPassword123!") > 80);
    }
}