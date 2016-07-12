package com.stormpath.jjwtsite.model;


public class SecureKeyResponse {

    final String secureKey;
    final String alg;

    public SecureKeyResponse(String alg, String secureKey) {
        this.alg = alg;
        this.secureKey = secureKey;
    }

    public String getSecureKey() {
        return secureKey;
    }

    public String getAlg() {
        return alg;
    }
}
