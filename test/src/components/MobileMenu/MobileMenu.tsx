import type { JSX } from "react";

import { useI18n } from "../../I18n";
import { Button } from "../common/Button";
import { MobileLanguageSelector } from "../LanguageSelector/LanguageSelector";
import { MobileMenuContainer, MobileMenuItem } from "./MobileMenu.styles";

interface MobileMenuProps {
    handleLanguageChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function MobileMenu({ handleLanguageChange }: MobileMenuProps): JSX.Element {
    const i = useI18n();

    return (
        <MobileMenuContainer>
            <MobileMenuItem href="#features">{i.locText("Features")}</MobileMenuItem>
            <MobileMenuItem href="#customers">{i.locText("Customers")}</MobileMenuItem>
            <MobileMenuItem href="#pricing">{i.locText("Pricing")}</MobileMenuItem>
            <MobileMenuItem href="#docs">{i.locText("Documentation")}</MobileMenuItem>
            <MobileLanguageSelector onChange={handleLanguageChange} value={i.getLanguage()}>
                <option value="en">English</option>
                <option value="ko">한국어</option>
            </MobileLanguageSelector>
            <Button>{i.locText("Log In")}</Button>
            <Button primary>{i.locText("Sign Up")}</Button>
        </MobileMenuContainer>
    );
}
