$(document).ready(function () {
    var jwtEncodedTextArea = document.getElementById('jwt-encoded');
    jwtEncoded = CodeMirror.fromTextArea(jwtEncodedTextArea, {
        mode: 'application/json',
        lineWrapping: true,
        readOnly: true
    });
    jwtEncoded.getDoc().setValue("eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJNRSIsImN1c3RvbSI6Im15Q3VzdG9tIn0.h7w99JgiYH2huiFCxgRemjrl99-TvdXTQU3UHdSLfxg");
    jwtEncoded.setSize(430, 250);

    var jwtHeaderTextArea = document.getElementById('jwt-header');
    jwtHeader = CodeMirror.fromTextArea(jwtHeaderTextArea, {
        mode: 'application/json',
        lineNumbers: true,
        matchBrackets: true
    });
    jwtHeader.getDoc().setValue('{\n\t"alg": "HS256"\n}');
    jwtHeader.setSize(430, 90);

    var jwtPayloadTextArea = document.getElementById('jwt-payload');
    jwtPayload = CodeMirror.fromTextArea(jwtPayloadTextArea, {
        mode: 'application/json',
        lineNumbers: true,
        matchBrackets: true,
        autofocus: true
    });
    jwtPayload.getDoc().setValue('{\n\t"sub": "ME",\n\t"custom": "myCustom"\n}');
    jwtPayload.setSize(430, 120);

    var jwtBuilderTextArea = document.getElementById('jwt-builder');
    jwtBuilder = CodeMirror.fromTextArea(jwtBuilderTextArea, {
        lineNumbers: true,
        matchBrackets: true,
        readOnly: true
    });
    jwtBuilder.getDoc().setValue('String jwtStr = Jwts.builder()\n\t.setSubject("ME")\n\t.claim("custom", "myCustom")\n\t.signWith(\n\t\tSignatureAlgorithm.HS256,\n\t\t"secret".getBytes("UTF-8")\n\t)\n\t.compact();');
    jwtBuilder.setSize(430, 250);

    var jwtParserTextArea = document.getElementById('jwt-parser');
    jwtParser = CodeMirror.fromTextArea(jwtParserTextArea, {
        lineNumbers: true,
        matchBrackets: true,
        readOnly: true
    });
    jwtParser.getDoc().setValue('Jwt jwt = Jwts.parser()\n\t.requireSubject("ME")\n\t.require("custom", "myCustom")\n\t.setSigningKey(\n\t\t"secret".getBytes("UTF-8")\n\t)\n\t.parse(jwtStr);');
    jwtParser.setSize(430, 250);

    jwtHeader.on('change', function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTBuilderCode();
    });

    jwtPayload.on('change', function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTBuilderCode();
    });

    jwtHeader.on('change', function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTBuilderCode();
    });

    $('#secret').keyup(function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTBuilderCode();
    });

    $('#require_claims').click(function () {
        buildJavaJWTBuilderCode();
    });

    $.blockUI.defaults.css.width = '70%';
});

function validateAlgorithm(header) {
    if (!header.alg) {
        throw "Missing Algorithm, Son!";
    }
    
    var validAlgorithms = [
        "HS256",
        "HS384",
        "HS512",
        "RS256",
        "RS384",
        "RS512",
        "ES256",
        "ES384",
        "ES512",
        "PS256",
        "PS384",
        "PS512"
    ];

    if (!_.contains(validAlgorithms, header.alg)) {
        throw "Invalid Algorithm, Son!";
    } else if (!header.alg.startsWith("HS")) {
        throw "Valid algorithm, but this demo doesn't support it, Son!";
    }
}

function parseJWTJSON() {
    var headerStr = jwtHeader.getValue();
    var payloadStr = jwtPayload.getValue();
    var secret = $('#secret').val();

    // lets make some json
    var header = {};
    var payload = {};
    try {
        header = JSON.parse(headerStr);
    } catch (err) {
        // parse error is ok. user might just be in the middle of editing
        blockJava('Fix yer JSON, Son!');
        return;
    }
    
    try {
        validateAlgorithm(header);
    } catch (err) {
        blockJava(err);
        return;
    }

    try {
        payload = JSON.parse(payloadStr);
    } catch (err) {
        // parse error is ok. user might just be in the middle of editing
        blockJava('Fix yer JSON, Son!');
        return;
    }

    if (!secret) {
        blockJava('Fix yer secret, Son!');
        return;
    }

    unblockJava();

    return {
        header: header,
        payload: payload,
        secret: secret
    }
}

function buildJavaJWTBuilderCode() {
    var jwtParts = parseJWTJSON();
    if (!jwtParts) { return; }

    doBuildJWT(jwtParts);

    var javaPreStr = 'String jwtStr = Jwts.builder()\n';
    var javaMiddle = '';
    var javaPostStr = '\t.signWith(\n\t\tSignatureAlgorithm.' + jwtParts.header.alg + ',\n\t\t"' +
        jwtParts.secret + '".getBytes("UTF-8")\n\t)\n\t.compact();';

    _.each(jwtParts.header, function (val, key) {
        if (key !== 'alg') {
            javaMiddle += '\t' + composeHeaderParam(key, val) + '\n';
        }
    });
    
    _.each(jwtParts.payload, function (val, key) {
       javaMiddle += '\t' + composeClaim('set', key, val) + '\n';
    });

    jwtBuilder.setValue(javaPreStr + javaMiddle + javaPostStr);

    javaPreStr = 'Jwt jwt = Jwts.parser()\n';
    javaMiddle = '';
    javaPostStr = '\t.setSigningKey(\n\t\t"' + jwtParts.secret + '".getBytes("UTF-8")\n\t)\n\t.parse(jwtStr);';

    if ($('#require_claims').prop("checked") == true) {
        _.each(jwtParts.payload, function (val, key) {
            javaMiddle += '\t' + composeClaim('require', key, val) + '\n';
        });
    }

    jwtParser.setValue(javaPreStr + javaMiddle + javaPostStr);
}

function doBuildJWT(jwtParts) {

    $.ajax({
        url: "buildJWT",
        method: "POST",
        data: JSON.stringify(jwtParts),
        dataType: 'json',
        contentType: "application/json",
        success: function (response, status, jqXHR) {
            jwtEncoded.setValue(response.jwt);
        },
        error: function (jqXHR, textStatus, errorThrown){
            //Do something
        }
    });
}

function unblockJava() {
    $('#jwt-builder-div').unblock();
    $('#jwt-parser-div').unblock();
}

function blockJava(msg) {
    blockIfNotBlocked('#jwt-builder-div', msg);
    blockIfNotBlocked('#jwt-parser-div', msg);
}

function isBlocked(elemId) {
    var data = $(elemId).data()
    return data["blockUI.isBlocked"] == 1;
}

function msgChanged(elemId, msg) {
    // hack!
    return $(elemId + "> .blockMsg > h4").text() !== msg;
}

function blockIfNotBlocked(elemId, msg) {
    if (!isBlocked(elemId) || msgChanged(elemId, msg)) {
        $(elemId).block({
            message: '<h4>' + msg + '</h4>',
            css: { border: '3px solid #a00' }
        });
    }
}

function composeHeaderParam(key, val) {
    var type = typeof val;
    if (type === "string") {
        val = '"' + val + '"';
    }
    return '.setHeaderParam("' + key + '", ' + val + ')';
}

function composeClaim(pre, key, val) {

    var standardClaims = {
        'iss': { method: 'Issuer', type: "string" },
        'sub': { method: 'Subject', type: "string" },
        'aud': { method: 'Audience', type: "string" },
        'exp': { method: 'Expiration', type: "number" },
        'nbf': { method: 'NotBefore', type: "number" },
        'iat': { method: 'IssuedAt', type: "number" },
        'jti': { method: 'Id', type: "string" }
    };

    var setter = standardClaims[key];
    var type = typeof val;
    if (type === "string") {
        val = '"' + val + '"';
    } else if (type === "number") {
        val = 'new Date(' + val + ')';
    }

    if (!setter) {
        var method = 'require';
        if (pre === 'set') {
            method = 'claim';
        }
        return '.' + method + '("' + key + '", ' + val + ')';
    } else if (setter.type !== type) {
        blockJava("'" + key + "' must be type: " + setter.type);
    } else {
        return '.' + pre + setter.method + '(' + val + ')';
    }
}