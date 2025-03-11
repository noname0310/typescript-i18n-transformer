import styled from "styled-components";

export const FeaturesContainer = styled.section`
    padding: 6rem 0;
    background-color: ${(props): string => props.theme.colors.backgroundAlt};
    border-radius: 20px;
    margin: 2rem 0;
`;

export const SectionTitle = styled.h2`
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;
    
    @media (max-width: 768px) {
        font-size: 2rem;
    }
`;

export const FeatureGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
    padding: 0 2rem;
`;

export const FeatureCard = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 2rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    
    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
`;

export const FeatureIcon = styled.div`
    font-size: 2.5rem;
    margin-bottom: 1rem;
`;

export const FeatureTitle = styled.h3`
    font-size: 1.4rem;
    margin-bottom: 1rem;
`;

export const FeatureDescription = styled.p`
    color: ${(props): string => props.theme.colors.secondary};
    font-size: 1rem;
    line-height: 1.6;
`;
