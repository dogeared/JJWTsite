$(document).ready(function () {
    var jwtEncodedTextArea = document.getElementById('jwt-encoded');
    jwtEncoded = CodeMirror.fromTextArea(jwtEncodedTextArea, {
        mode: 'application/json',
        lineWrapping: true,
        readOnly: true
    });
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
        matchBrackets: true
    });
    jwtPayload.getDoc().setValue('{\n\t"sub": "ME",\n\t"custom": "myCustom"\n}');
    jwtPayload.setSize(430, 120);

    var jwtBuilderTextArea = document.getElementById('jwt-builder');
    jwtBuilder = CodeMirror.fromTextArea(jwtBuilderTextArea, {
        lineNumbers: true,
        matchBrackets: true,
        readOnly: true
    });
    jwtBuilder.setSize(430, 250);

    var jwtParserTextArea = document.getElementById('jwt-parser');
    jwtParser = CodeMirror.fromTextArea(jwtParserTextArea, {
        lineNumbers: true,
        matchBrackets: true,
        readOnly: true
    });
    jwtParser.setSize(430, 250);

    jwtHeader.on('change', function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        generateSecureKey(function () {
            // don't want to build the JWT until we have a secret
            buildJavaJWTBuilderCode();
        })
    });

    jwtPayload.on('change', function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTBuilderCode();
    });

    jwtHeader.on('change', function () {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTBuilderCode();
    });

    $('#require_claims').click(function () {
        buildJavaJWTBuilderCode();
    });

    $.blockUI.defaults.css.width = '70%';

    $('#gen-secure-key').click(function () {
        generateSecureKey(function () {
            // don't want to build the JWT until we have a secret
            buildJavaJWTBuilderCode();
        });
    });

    generateSecureKey(function () {
        // don't want to build the JWT until we have a secret
        buildJavaJWTBuilderCode();
    });
});

function buildJavaJWTBuilderCode() {
    var jwtParts = parseJWTJSON();
    if (!jwtParts) { return; }

    doBuildJWT(jwtParts);

    var javaPreStr = 'String jwtStr = Jwts.builder()\n';
    var javaMiddle = '';
    javaPostStr = '\t.signWith(\n\t\tSignatureAlgorithm.' + jwtParts.header.alg + ',\n\t\t' +
        'TextCodec.BASE64.decode(\n\t\t\t' +
        '\/\/ This generated signing key is\n\t\t\t' +
        '\/\/ the proper length for the\n\t\t\t' +
        '\/\/ ' + jwtParts.header.alg + ' algorithm.\n\t\t\t' +
        '"' + jwtParts.secret + '"\n\t\t)\n\t)\n\t.compact();';

    _.each(jwtParts.header, function (val, key) {
        if (key !== 'alg') {
            javaMiddle += '\t' + composeHeaderParam(key, val) + '\n';
        }
    });
    
    _.each(jwtParts.payload, function (val, key) {
       javaMiddle += '\t' + composeClaim('set', key, val) + '\n';
    });

    jwtBuilder.setValue(javaPreStr + javaMiddle + javaPostStr);

    javaPreStr = 'Jws<Claims> jws = Jwts.parser()\n';
    javaMiddle = '';
    javaPostStr = '\t.setSigningKey(\n\t\tTextCodec.BASE64.decode(\n\t\t\t"' + jwtParts.secret + '"\n\t\t)\n\t)\n\t.parseClaimsJws(jwtStr);';

    if ($('#require_claims').prop("checked") == true) {
        _.each(jwtParts.payload, function (val, key) {
            javaMiddle += '\t' + composeClaim('require', key, val) + '\n';
        });
    }

    jwtParser.setValue(javaPreStr + javaMiddle + javaPostStr);
}

function parseJWTJSON() {
    var headerStr = jwtHeader.getValue();
    var payloadStr = jwtPayload.getValue();
    //var secret = $('#secret').val();
    var secret = $('#secure-key').text();

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

function generateSecureKey(func) {
    var headerStr = jwtHeader.getValue();
    var header = JSON.parse(headerStr);

    try {
        validateAlgorithm(header);
    } catch (err) {
        blockJava(err);
        return;
    }

    $.ajax({
        url: "getSecureKey",
        method: "POST",
        data: JSON.stringify({
            header: header
        }),
        dataType: 'json',
        contentType: "application/json",
        success: function (response, status, jqXHR) {
            $('#secure-key').text(response.secureKey);
            func();
        },
        error: function (jqXHR, textStatus, errorThrown){
            //Do something
        }
    });
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
        throw "Valid algorithm, but this demo doesn't support it, Son!<p/>Use: HS256, HS384 or HS512";
    }
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