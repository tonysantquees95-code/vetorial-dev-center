/**
 * O V da Vetorial Tech (a marca nova) com DEV embaixo, grande e sem fundo, com um brilho suave que pulsa devagar.
 * Quem pede menos movimento no aparelho recebe o V parado.
 */
export function LogoVivo({ tam = 40, className = "" }: { tam?: number; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/logo-v-dev.png`}
      alt="Vetorial Tech"
      width={tam}
      className={`logo-vivo inline-block flex-none ${className}`}
      draggable={false}
    />
  );
}
