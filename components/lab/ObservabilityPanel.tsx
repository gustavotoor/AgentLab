"use client"

interface ObservabilityPanelProps {
  dashboardUrl?: string | null
}

export function ObservabilityPanel({ dashboardUrl }: ObservabilityPanelProps) {
  if (dashboardUrl) {
    return (
      <div className="h-full w-full rounded-lg overflow-hidden border border-border">
        <iframe
          src={dashboardUrl}
          className="w-full h-full"
          title="Langfuse Dashboard"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-[#0d1117] p-6 text-center">
      <span className="text-2xl">🔬</span>
      <p className="text-sm font-medium text-foreground">Observabilidade com Langfuse</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Configure <code className="text-xs bg-muted px-1 rounded">NEXT_PUBLIC_LANGFUSE_DASHBOARD_URL</code> no{" "}
        <code className="text-xs bg-muted px-1 rounded">.env.local</code> para ver traces, spans, tokens e custos em tempo real.
      </p>
      <a
        href="https://cloud.langfuse.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary underline underline-offset-2"
      >
        Criar conta gratuita →
      </a>
    </div>
  )
}
