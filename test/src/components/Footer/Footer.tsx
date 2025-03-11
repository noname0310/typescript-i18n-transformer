import type { JSX } from "react";

import { useI18n } from "../../I18n";
import {
    Copyright,
    FooterColumn,
    FooterContainer,
    FooterGrid,
    FooterLink,
    FooterLinks,
    FooterTitle} from "./Footer.styles";

export function Footer(): JSX.Element {
    const i = useI18n();

    return (
        <FooterContainer>
            <FooterGrid>
                <FooterColumn>
                    <FooterTitle>{i.locText("Product")}</FooterTitle>
                    <FooterLinks>
                        <FooterLink><a href="#">{i.locText("Features")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Pricing")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Marketplace")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Enterprise")}</a></FooterLink>
                    </FooterLinks>
                </FooterColumn>
                <FooterColumn>
                    <FooterTitle>{i.locText("Resources")}</FooterTitle>
                    <FooterLinks>
                        <FooterLink><a href="#">{i.locText("Documentation")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Guides")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Blog")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Support")}</a></FooterLink>
                    </FooterLinks>
                </FooterColumn>
                <FooterColumn>
                    <FooterTitle>{i.locText("Company")}</FooterTitle>
                    <FooterLinks>
                        <FooterLink><a href="#">{i.locText("About")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Careers")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Contact")}</a></FooterLink>
                        <FooterLink><a href="#">{i.locText("Legal")}</a></FooterLink>
                    </FooterLinks>
                </FooterColumn>
            </FooterGrid>
            <Copyright>
                {i.locText("© 2025 DevFlow, Inc. All rights reserved.")}
            </Copyright>
        </FooterContainer>
    );
}
