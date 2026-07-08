
const sizeStyles = {
  sm: 'h-[30px] w-[30px] text-[11px]',
  md: 'h-[44px] w-[44px] text-[15px]',
};

const colorStyles = {
  seal: 'border-[#a63d2f] text-[#a63d2f]',
  gold: 'border-[#b08b2e] text-[#b08b2e]',
  olive: 'border-[#4b7355] text-[#4b7355]',
  ink: 'border-[#5b6b75] text-[#5b6b75]',
};

export default function Stamp({ children, size = 'md', color = 'seal', className = '', style }) {
  return (
    <div
      className={`relative flex shrink-0 rotate-[-6deg] items-center justify-center rounded-full border-2 border-current ${sizeStyles[size] ?? sizeStyles.md} ${colorStyles[color] ?? colorStyles.seal} ${className}`}
      style={style}
    >
      <span className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-current/60 font-['Markazi_Text'] font-bold tracking-[0.5px]">
        {children}
      </span>
    </div>
  );
}
