import type { JSX } from "react";

import { useI18n } from "../../I18n";
import {
    FeatureCard,
    FeatureDescription,
    FeatureGrid,
    FeatureIcon,
    FeaturesContainer,
    FeatureTitle,
    SectionTitle} from "./Features.styles";

export function Features(): JSX.Element {
    const i = useI18n();

    return (
        <FeaturesContainer id="features">
            <SectionTitle>{i.locText("Powerful Features for Modern Development")}</SectionTitle>
            <FeatureGrid>
                <FeatureCard>
                    <FeatureIcon>⚡</FeatureIcon>
                    <FeatureTitle>{i.locText("Instant Deployment")}</FeatureTitle>
                    <FeatureDescription>
                        {i.locText("Deploy directly from your Git repository with zero configuration and go live in seconds.")}
                    </FeatureDescription>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>🌐</FeatureIcon>
                    <FeatureTitle>{i.locText("Global CDN")}</FeatureTitle>
                    <FeatureDescription>
                        {i.locText("Your applications are automatically distributed across our global edge network.")}
                    </FeatureDescription>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>🛡️</FeatureIcon>
                    <FeatureTitle>{i.locText("Built-in Security")}</FeatureTitle>
                    <FeatureDescription>
                        {i.locText("SSL certificates, DDoS protection, and more security features included by default.")}
                    </FeatureDescription>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>📊</FeatureIcon>
                    <FeatureTitle>{i.locText("Analytics & Insights")}</FeatureTitle>
                    <FeatureDescription>
                        {i.locText("Gain valuable insights into your application's performance and user behavior.")}
                    </FeatureDescription>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>🔄</FeatureIcon>
                    <FeatureTitle>{i.locText("Continuous Integration")}</FeatureTitle>
                    <FeatureDescription>
                        {i.locText("Automated builds and deployments with every code push to your repository.")}
                    </FeatureDescription>
                </FeatureCard>
                <FeatureCard>
                    <FeatureIcon>📱</FeatureIcon>
                    <FeatureTitle>{i.locText("Responsive Design")}</FeatureTitle>
                    <FeatureDescription>
                        {i.locText("Ensure your application looks great on any device with our responsive design tools.")}
                    </FeatureDescription>
                </FeatureCard>
            </FeatureGrid>
        </FeaturesContainer>
    );
}
