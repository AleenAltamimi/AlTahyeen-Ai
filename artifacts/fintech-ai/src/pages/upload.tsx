import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { UploadCloud, File, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { usePredictCsv } from '@workspace/api-client-react';
import { usePrediction } from '../contexts/PredictionContext';
import { motion } from 'framer-motion';

export default function UploadPage() {
  const [location, setLocation] = useLocation();
  const { setCurrentPrediction } = usePrediction();
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const predictCsvMutation = usePredictCsv();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    
    // As per instructions, pass the file object inside an object matching CsvUpload schema.
    // The generated hook handles building FormData internally.
    predictCsvMutation.mutate({ data: { file } }, {
      onSuccess: (result) => {
        setCurrentPrediction(result);
        setLocation('/dashboard');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
        <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full max-w-2xl overflow-hidden">
          <div className="p-8 border-b border-gray-100 text-center">
            <h1 className="text-2xl font-black text-gray-900 mb-2">Upload Transaction Data</h1>
            <p className="text-gray-500 text-sm">Upload a CSV file containing your recent transactions for AI analysis.</p>
          </div>

          <div className="p-8">
            {!file ? (
              <div 
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/50 bg-gray-50 hover:bg-gray-50/50'}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleChange}
                />
                <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Click or drag file to this area to upload</h3>
                <p className="text-sm text-gray-500">Supports .CSV up to 10MB</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded flex items-center justify-center">
                      <File className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{file.name}</h4>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  {!predictCsvMutation.isPending && (
                    <button 
                      onClick={() => setFile(null)} 
                      className="text-sm text-gray-500 hover:text-red-600 font-medium px-3 py-1"
                    >
                      Replace
                    </button>
                  )}
                </div>

                {predictCsvMutation.isError && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm">Analysis Failed</h4>
                      <p className="text-sm mt-1">{predictCsvMutation.error?.error || 'An unexpected error occurred.'}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={predictCsvMutation.isPending}
                  className="w-full bg-primary text-white py-3.5 rounded-lg font-bold shadow-md hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {predictCsvMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing data...
                    </>
                  ) : (
                    'Run AI Analysis'
                  )}
                </button>
                
                {predictCsvMutation.isPending && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-sm font-medium text-gray-500 animate-pulse">
                      Running fraud detection models...
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
