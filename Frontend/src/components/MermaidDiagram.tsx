import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
});

interface MermaidDiagramProps {
    chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
        const renderChart = async () => {
            if (containerRef.current && chart) {
                try {
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, chart);
                    setSvg(svg);
                } catch (error) {
                    console.error('Mermaid rendering failed:', error);
                    setSvg(`<div class="text-red-500 text-sm">Failed to render diagram</div>`);
                }
            }
        };

        renderChart();
    }, [chart]);

    return (
        <div
            className="mermaid-container my-4 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto flex justify-center"
            ref={containerRef}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}
