
export default function Stamp({ children, size = 'md', color = 'seal', className = '', style }) {
  const classes = ['stamp', size === 'sm' ? 'sm' : '', color !== 'seal' ? color : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} style={style}>
      <span>{children}</span>
    </div>
  );
}
