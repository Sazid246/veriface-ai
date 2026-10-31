export type Label = 'REAL' | 'FAKE'
export interface Prediction {
  prediction_id: string; predicted_label: Label; scores: Record<Label, number>
  score_type?: string; model_name: string; processing_time_ms: number; timestamp: string
}
export interface HistoryResponse { storage: string; items: Prediction[] }
export interface Health { status: string; model_loaded: boolean; model_name: string | null }
export interface ModelInfo {
  model_name: string; ready: boolean; pipeline: string[]; classes: Record<string, string>; score_note: string
  decision_threshold: number; metrics_note: string | null; version_warning: string | null
  evaluation_metrics: { test_metrics_selected?: Record<string, number>; split_sizes?: Record<string, number> } | null
  feature_extraction: { library: string; image_size: number; resize: string; colour: string; feature_dim: number
    hog: { orientations: number; pixels_per_cell: number; cells_per_block: number; block_norm: string; input: string } }
}
