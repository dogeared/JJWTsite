package com.stormpath.jjwtsite.controller;

import com.stormpath.jjwtsite.model.JWTBuilderResponse;
import com.stormpath.jjwtsite.model.JWTPartsRequest;
import com.stormpath.jjwtsite.model.SecureKeyResponse;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.impl.TextCodec;
import io.jsonwebtoken.impl.crypto.MacProvider;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
public class JJWTController {

    @RequestMapping("/buildJWT")
    public @ResponseBody JWTBuilderResponse buildJWT(@RequestBody JWTPartsRequest request) throws Exception {

        SignatureAlgorithm alg = SignatureAlgorithm.forName((String) request.getHeader().get("alg"));

        String jwt = Jwts.builder()
            .setHeader(request.getHeader())
            .setClaims(request.getPayload())
            .signWith(alg, TextCodec.BASE64.decode(request.getSecret()))
            .compact();

        JWTBuilderResponse response = new JWTBuilderResponse();
        response.setMessage("Built JWT!");
        response.setStatus("SUCCESS");
        response.setJwt(jwt);

        return response;
    }

    @RequestMapping("/getSecureKey")
    public @ResponseBody SecureKeyResponse getSecureKey(@RequestBody JWTPartsRequest request) throws Exception {
        String algStr = (String) request.getHeader().get("alg");
        SignatureAlgorithm alg = SignatureAlgorithm.forName(algStr);

        String key = TextCodec.BASE64.encode(MacProvider.generateKey(alg).getEncoded());

        return new SecureKeyResponse(algStr, key);
    }
}
