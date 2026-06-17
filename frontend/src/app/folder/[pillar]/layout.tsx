export function generateStaticParams() {
  return [
    { pillar: 'deen' },
    { pillar: 'elesium' },
    { pillar: 'influence' },
    { pillar: 'self' },
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
