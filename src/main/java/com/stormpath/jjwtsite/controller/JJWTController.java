package com.stormpath.jjwtsite.controller;

import com.stormpath.jjwtsite.model.JWTBuilderResponse;
import com.stormpath.jjwtsite.model.JWTPartsRequest;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
public class JJWTController {

    @RequestMapping("/buildJWT")
    public JWTBuilderResponse buildJWT(JWTPartsRequest request) throws Exception {

        JwtBuilder builder = Jwts.builder();

        for (String key : request.getPayload().keySet()) {
            switch (key) {
                case "iss":
                    builder.setIssuer((String)request.getPayload().get("iss"));
                    break;
                case "sub":
                    builder.setSubject((String)request.getPayload().get("sub"));
                    break;
                case "aud":
                    builder.setAudience((String)request.getPayload().get("aud"));
                    break;
                case "exp":
                    builder.setExpiration(new Date(Long.valueOf((String)request.getPayload().get("exp"))));
                    break;
                case "nbf":
                    builder.setNotBefore(new Date(Long.valueOf((String)request.getPayload().get("nbf"))));
                    break;
                case "iat":
                    builder.setIssuedAt(new Date(Long.valueOf((String)request.getPayload().get("iat"))));
                    break;
                case "jti":
                    builder.setId((String)request.getPayload().get("jti"));
                    break;
                default:
                    builder.claim(key, request.getPayload().get(key));
                    break;
            }
        }

        String jwt = builder.signWith(SignatureAlgorithm.HS256, request.getSecret().getBytes("UTF-8")).compact();

        JWTBuilderResponse response = new JWTBuilderResponse();
        response.setMessage("Built JWT!");
        response.setStatus("SUCCESS");
        response.setJwt(jwt);

        return response;
    }
}