import styled from "styled-components";

export const HeroContainer = styled.section`
    padding: 6rem 0 4rem;
    text-align: center;
`;

export const HeroTitle = styled.h1`
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1.5rem;
    background: linear-gradient(to right, #fff, #aaa);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    
    @media (max-width: 768px) {
        font-size: 2.5rem;
    }
`;

export const HeroSubtitle = styled.p`
    font-size: 1.5rem;
    color: ${(props): string => props.theme.colors.secondary};
    max-width: 600px;
    margin: 0 auto 2rem;

    @media (max-width: 768px) {
        font-size: 1.2rem;
    }
`;

export const ButtonGroup = styled.div`
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 2rem 0;
`;

export const AnimatedGradient = styled.div`
    margin: 4rem auto;
    width: 80%;
    max-width: 800px;
    height: 400px;
    background: linear-gradient(45deg, #0070f3, #7928ca, #ff0080);
    background-size: 600% 600%;
    animation: gradientAnimation 10s ease infinite;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.5);

    @keyframes gradientAnimation {
        0% { background-position: 0% 50% }
        50% { background-position: 100% 50% }
        100% { background-position: 0% 50% }
    }
`;
