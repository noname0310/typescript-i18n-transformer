import type { JSX } from "react";

import { useI18n } from "../../I18n";
import { Button } from "../common/Button";
import { AnimatedGradient, ButtonGroup, HeroContainer, HeroSubtitle, HeroTitle } from "./Hero.styles";

export function Hero(): JSX.Element {
    const i = useI18n();

    return (
        <HeroContainer>
            <HeroTitle>{i.locText("Deploy Your Code with Confidence")}</HeroTitle>
            <HeroSubtitle>
                {i.locText("The platform for developers to deploy, scale, and secure modern web applications.")}
            </HeroSubtitle>
            <ButtonGroup>
                <Button primary>{i.locText("Get Started")}</Button>
                <Button>{i.locText("View Documentation")}</Button>
            </ButtonGroup>
            <AnimatedGradient>
                <img src="/api/placeholder/600/300" alt={i.locText("Platform Demo")} />
            </AnimatedGradient>
        </HeroContainer>
    );
}
