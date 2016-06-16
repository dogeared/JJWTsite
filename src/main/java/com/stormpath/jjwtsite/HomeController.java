package com.stormpath.jjwtsite;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Created by chunsaker on 6/16/16.
 */

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


}
