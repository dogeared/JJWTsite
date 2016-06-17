package com.stormpath.jjwtsite.controller;

import com.stormpath.jjwtsite.model.JWTBuilderResponse;
import com.stormpath.jjwtsite.model.JWTPartsRequest;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;

@RestController
public class JJWTController {

    @RequestMapping("/buildJWT")
    public @ResponseBody JWTBuilderResponse buildJWT(@RequestBody JWTPartsRequest request) throws Exception {

        String jwt = Jwts.builder()
            .setClaims(request.getPayload())
            .signWith(SignatureAlgorithm.HS256, request.getSecret().getBytes("UTF-8"))
            .compact();

        JWTBuilderResponse response = new JWTBuilderResponse();
        response.setMessage("Built JWT!");
        response.setStatus("SUCCESS");
        response.setJwt(jwt);

        return response;
    }
}
