$(document).ready(function () {
    var jwtHeaderTextArea = document.getElementById('jwt-header');
    jwtHeader = CodeMirror.fromTextArea(jwtHeaderTextArea, {
        mode: 'application/json',
        lineNumbers: true,
        matchBrackets: true
    });
    jwtHeader.getDoc().setValue('{\n\t"alg": "HS256",\n\t"typ": "JWT"\n}');
    jwtHeader.setSize(400, 100);

    var jwtPayloadTextArea = document.getElementById('jwt-payload');
    jwtPayload = CodeMirror.fromTextArea(jwtPayloadTextArea, {
        mode: 'application/json',
        lineNumbers: true,
        matchBrackets: true
    });
    jwtPayload.getDoc().setValue('{\n\t"sub": "ME",\n\t"custom": "myCustom"\n}');
    jwtPayload.setSize(400, 130);

    var jwtBuilderTextArea = document.getElementById('jwt-builder');
    jwtBuilder = CodeMirror.fromTextArea(jwtBuilderTextArea, {
        lineNumbers: true,
        matchBrackets: true
    });
    jwtBuilder.getDoc().setValue('String jwtStr = Jwts.builder()\n\t.setSubject("ME")\n\t.claim("custom", "myCustom")\n\t.signWith(\n\t\tSignatureAlgorithm.HS256,\n\t\tsecret.getBytes("UTF-8")\n\t)\n\t.compact();');
    jwtBuilder.setSize(400, 250);

    var jwtParserTextArea = document.getElementById('jwt-parser');
    jwtParser = CodeMirror.fromTextArea(jwtParserTextArea, {
        lineNumbers: true,
        matchBrackets: true
    });
    jwtParser.getDoc().setValue('Jwt jwt = Jwts.parser()\n\t.setSigningKey(secret.getBytes("UTF-8"))\n\t.parse(jwtStr);');
    jwtParser.setSize(400, 250);

    jwtHeader.on('change', function() {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTCode();
    });

    jwtPayload.on('change', function() {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTCode();
    });

    $('#secret').keypress(function() {
        // need to update jwtBuilder, jwtParser and jwt sections
        buildJavaJWTCode();
    });

    $.blockUI.defaults.css.width = '70%';
});

function buildJavaJWTCode() {
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
        payload = JSON.parse(payloadStr);
    } catch (err) {
        // parse error is ok. user might just be in the middle of editing
        blockJava('Fix yer JSON, Son!');
        return;
    }

    unblockJava();

    var javaPreStr = 'String jwtStr = Jwts.builder()\n';
    var javaMiddle = '';
    var javaPostStr = '\t.signWith(\n\t\tSignatureAlgorithm.HS256,\n\t\tsecret.getBytes("UTF-8")\n\t)\n\tcompact()';

    // deal with header

    // deal with payload
    _.each(payload, function (val, key) {
       javaMiddle += '\t' + composeClaim(key, val) + '\n';
    });

    jwtBuilder.setValue(javaPreStr + javaMiddle + javaPostStr);
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

function blockIfNotBlocked(elemId, msg) {
    if (!isBlocked(elemId)) {
        $(elemId).block({
            message: '<h4>' + msg + '</h4>',
            css: { border: '3px solid #a00' }
        });
    }
}

function composeClaim(key, val) {

    var standardClaims = {
        'iss': { method: 'setIssuer', type: "string" },
        'sub': { method: 'setSubject', type: "string" },
        'aud': { method: 'setAudience', type: "string" },
        'exp': { method: 'setExpiration', type: "number" },
        'nbf': { method: 'setNotBefore', type: "number" },
        'iat': { method: 'issuedAt', type: "number" },
        'jti': { method: 'setId', type: "string" }
    };

    var setter = standardClaims[key];
    var type = typeof val;
    if (type === "string") {
        val = '"' + val + '"'
    }
    if (!setter) {
        return '.claim("' + key + '", ' + val + ')';
    } else {
        if (setter.type !== type) {
            blockJava("'" + key + "' must be type: " + setter.type);
            return;
        }
        return '.' + setter.method + '(' + val + ')';
    }
}