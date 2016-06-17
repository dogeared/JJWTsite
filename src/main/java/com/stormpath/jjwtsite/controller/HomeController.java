package com.stormpath.jjwtsite.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class HomeController {

    @RequestMapping("/")
    public String home() {
        return "home";
    }

    @RequestMapping("/jwt101")
    public String jwt101() {
        return "jwt101";
    }

    @RequestMapping("/jjwtdocs")
    public String jjwtdocs() {
        return "jjwtdocs";
    }

    @RequestMapping("/jwtfun")
    public String jwtFun() {
        return "jwtfun";
    }
}
