import type { JSX } from "react";
import { useState } from "react";
import { ThemeProvider } from "styled-components";

import { Container } from "./components/common/Container";
import { Features } from "./components/Features/Features";
import { Footer } from "./components/Footer/Footer";
import { Header } from "./components/Header/Header";
import { Hero } from "./components/Hero/Hero";
import { MobileMenu } from "./components/MobileMenu/MobileMenu";
import { useI18n } from "./I18n";
import { GlobalStyle } from "./styles/GlobalStyles";
import { theme } from "./styles/theme";

// Main App Component
export function App(): JSX.Element {
    const i = useI18n();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Handle language change
    const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        console.log(event.target.value);
        i.setLanguage(event.target.value as "en" | "ko");
    };

    return (
        <ThemeProvider theme={theme}>
            <GlobalStyle />
            <Container>
                <Header
                    isMenuOpen={isMenuOpen}
                    setIsMenuOpen={setIsMenuOpen}
                    handleLanguageChange={handleLanguageChange}
                />

                {isMenuOpen && <MobileMenu handleLanguageChange={handleLanguageChange} />}

                <Hero />
                <Features />
                <Footer />
            </Container>
        </ThemeProvider>
    );
}
