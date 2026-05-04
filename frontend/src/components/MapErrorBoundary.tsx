import { Component, type ErrorInfo, type ReactNode } from "react";

interface MapErrorBoundaryProps {
  children: ReactNode;
  height?: string;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Map rendering error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="map-hint" style={{ height: this.props.height ?? "400px" }}>
          El mapa no se pudo cargar. Recarga la pagina o intenta de nuevo.
        </div>
      );
    }

    return this.props.children;
  }
}
