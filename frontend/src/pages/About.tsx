const limits = ['Unseen manipulation methods or generators may not be recognised.', 'Dataset bias: the model reflects the images it was trained on.', 'Compression, resizing and screenshots change image statistics.',
  'Lighting and image-quality differences can shift the result.', 'False positives and false negatives are both possible.', 'Domain shift: real-world images may differ from the training data (the model was trained on face-style images).']
export default function About() {
  return (
    <div className="card space-y-4 p-5 sm:p-7"><h1 className="text-2xl font-extrabold">About VeriFace AI</h1>
      <p className="text-slate-700">VeriFace AI estimates whether an image resembles the REAL or FAKE examples seen during training. It resizes the image, extracts HOG (shape/texture) and HSV (colour) features, and passes them to a trained SVM classifier.</p>
      <h2 className="text-lg font-bold">Limitations</h2><ul className="list-disc space-y-1 pl-5 text-slate-700">{limits.map(l => <li key={l}>{l}</li>)}</ul>
      <p className="text-slate-700">Outputs are model-dependent scores, not calibrated probabilities, and should never be the sole basis for high-stakes decisions.</p>
      <h2 className="text-lg font-bold">Privacy</h2>
      <p className="text-slate-700">Uploaded images are processed in memory and are not written to disk by the application. Only the prediction ID, time, class, scores and processing time are saved to the server's local history database, which you can delete from the History page.</p></div>
  )
}
