/**
 * O V da Vetorial Tech (a marca nova), grande e sem fundo, com um brilho suave que pulsa devagar.
 * Quem pede menos movimento no aparelho recebe o V parado.
 */
export function LogoVivo({ tam = 40, className = "" }: { tam?: number; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/logo-v.png`}
      alt="Vetorial Tech"
      width={tam}
      height={tam}
      className={`logo-vivo inline-block flex-none ${className}`}
      draggable={false}
    />
  );
}
