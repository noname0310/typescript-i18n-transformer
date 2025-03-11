import type { JSX } from "react";

import { useI18n } from "../../I18n";
import { Button } from "../common/Button";
import { LanguageSelector } from "../LanguageSelector/LanguageSelector";
import { HeaderContainer, Logo, MobileMenuButton, Nav, NavItem } from "./Header.styles";

interface HeaderProps {
    isMenuOpen: boolean;
    setIsMenuOpen: (isOpen: boolean) => void;
    handleLanguageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function Header({ isMenuOpen, setIsMenuOpen, handleLanguageChange }: HeaderProps): JSX.Element {
    const i = useI18n();

    return (
        <HeaderContainer>
            <Logo>{i.locText("DEVFLOW")}</Logo>
            <Nav>
                <NavItem href="#features">{i.locText("Features")}</NavItem>
                <NavItem href="#customers">{i.locText("Customers")}</NavItem>
                <NavItem href="#pricing">{i.locText("Pricing")}</NavItem>
                <NavItem href="#docs">{i.locText("Documentation")}</NavItem>
                <LanguageSelector onChange={handleLanguageChange} value={i.getLanguage()}>
                    <option value="en">English</option>
                    <option value="ko">한국어</option>
                </LanguageSelector>
                <Button>{i.locText("Log In")}</Button>
                <Button primary>{i.locText("Sign Up")}</Button>
            </Nav>
            <MobileMenuButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                ☰
            </MobileMenuButton>
        </HeaderContainer>
    );
}
