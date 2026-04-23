package com.example.backend.Config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.ResourceResolver;
import org.springframework.web.servlet.resource.ResourceResolverChain;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(false)
                .addResolver(new PushStateResourceResolver());
        registry.addResourceHandler(
                "/sitemap.xml",
                "/robots.txt",
                "/google*.html",
                "/yandex*.html" // ✅ Yandex verification support
        ).addResourceLocations("classpath:/static/");
    }

    private static class PushStateResourceResolver implements ResourceResolver {

        private final Resource index = new ClassPathResource("/static/index.html");

        private final List<String> handledExtensions = Arrays.asList(
                "html", "js", "json", "css", "png", "svg", "jpg", "jpeg", "gif",
                "ico", "ttf", "woff", "woff2", "eot", "otf", "mp3", "mp4"
        );

        @Override
        public Resource resolveResource(HttpServletRequest request,
                                        String requestPath,
                                        List<? extends Resource> locations,
                                        ResourceResolverChain chain) {

            // 🔥 ENG MUHIM: sitemap.xml va robots.txt ni to‘g‘ridan-to‘g‘ri berish
            if (requestPath.endsWith(".xml") || requestPath.endsWith(".txt")) {
                return chain.resolveResource(request, requestPath, locations);
            }

            // 🔥 API ga tegmaydi
            if (requestPath.startsWith("api")) {
                return null;
            }

            // 🔥 Static fayllar (js, css, img)
            if (isHandled(requestPath)) {
                Resource resource = chain.resolveResource(request, requestPath, locations);
                if (resource != null) {
                    return resource;
                }
            }

            // 🔥 React SPA fallback
            return index;
        }

        @Override
        public String resolveUrlPath(String resourcePath,
                                     List<? extends Resource> locations,
                                     ResourceResolverChain chain) {

            Resource resource = chain.resolveResource(null, resourcePath, locations);
            if (resource == null) {
                return null;
            }

            try {
                return resource.getURL().toString();
            } catch (IOException e) {
                return resource.getFilename();
            }
        }

        private boolean isHandled(String path) {
            String ext = StringUtils.getFilenameExtension(path);
            return ext != null && handledExtensions.contains(ext);
        }
    }
}