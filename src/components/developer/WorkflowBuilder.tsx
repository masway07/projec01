import React, { useState } from 'react';
import {
  Play,
  Save,
  Plus,
  Trash2,
  Settings,
  Clock,
  Database,
  Globe,
  GitMerge,
  ListFilter,
  Split,
  FileCode,
  Mail,
  FileSpreadsheet,
  MessageSquare,
  CheckCircle2,
  X,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  icon: any;
  category: 'trigger' | 'source' | 'transform' | 'action';
  x: number;
  y: number;
  config?: Record<string, any>;
}

interface WorkflowConnection {
  fromNode: string;
  toNode: string;
  label?: string;
}

export const WorkflowBuilder: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(true);
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: 'cron', type: 'Cron', label: 'Cron', icon: Clock, category: 'trigger', x: 80, y: 220 },
    { id: 'airtable', type: 'Airtable', label: 'Airtable', icon: Database, category: 'source', x: 260, y: 120 },
    { id: 'http', type: 'HTTP Request', label: 'HTTP Request - n8n', icon: Globe, category: 'source', x: 260, y: 320 },
    { id: 'merge', type: 'Merge', label: 'Merge', icon: GitMerge, category: 'transform', x: 440, y: 220 },
    { id: 'itemLists', type: 'Item Lists', label: 'Item Lists', icon: ListFilter, category: 'transform', x: 620, y: 220 },
    { id: 'if', type: 'IF', label: 'IF', icon: Split, category: 'transform', x: 800, y: 140 },
    { id: 'split', type: 'SplitInBatches', label: 'SplitInBatches', icon: FileCode, category: 'transform', x: 800, y: 340 },
    { id: 'gmail', type: 'Gmail', label: 'Gmail', icon: Mail, category: 'action', x: 1000, y: 240 },
    { id: 'discord', type: 'Discord', label: 'Discord1', icon: MessageSquare, category: 'action', x: 1180, y: 240 }
  ]);

  const [connections, setConnections] = useState<WorkflowConnection[]>([
    { fromNode: 'cron', toNode: 'airtable' },
    { fromNode: 'cron', toNode: 'http' },
    { fromNode: 'airtable', toNode: 'merge', label: 'Input 1' },
    { fromNode: 'http', toNode: 'merge', label: 'Input 2' },
    { fromNode: 'merge', toNode: 'itemLists' },
    { fromNode: 'itemLists', toNode: 'if' },
    { fromNode: 'itemLists', toNode: 'split' },
    { fromNode: 'if', toNode: 'gmail', label: 'true' },
    { fromNode: 'gmail', toNode: 'discord' }
  ]);

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [execLogs, setExecLogs] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newNodeType, setNewNodeType] = useState<string>('Database ERP');
  const [newNodeCategory, setNewNodeCategory] = useState<'trigger' | 'source' | 'transform' | 'action'>('source');

  const handleExecute = () => {
    setIsExecuting(true);
    setExecLogs(['Memulai eksekusi workflow n8n...', 'Trigger Cron aktif...', 'Mengambil data dari sumber...', 'Transformasi & Merge data selesai...', 'Mengirim notifikasi aksi...']);
    setTimeout(() => {
      setIsExecuting(false);
      setExecLogs(prev => [...prev, 'Workflow berhasil dieksekusi tanpa error!']);
    }, 2500);
  };

  const handleAddNode = () => {
    const id = `node_${Date.now()}`;
    const newNode: WorkflowNode = {
      id,
      type: newNodeType,
      label: newNodeType,
      icon: Database,
      category: newNodeCategory,
      x: 500,
      y: 200
    };
    setNodes(prev => [...prev, newNode]);
    setShowAddModal(false);
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.fromNode !== id && c.toNode !== id));
    setSelectedNode(null);
  };

  return (
    <div className="relative w-full h-[780px] bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">ERP Data Integration - Main Workflow</h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700">course</span>
            </div>
            <p className="text-xs text-slate-400">Visual drag & drop pipeline integration (n8n Engine)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span className="text-xs font-medium text-slate-300">Active:</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-600 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          <button
            onClick={() => alert('Workflow berhasil disimpan ke sistem!')}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      {/* Canvas Area with Dot Pattern */}
      <div className="relative flex-1 bg-[#0b0f19] overflow-hidden cursor-grab active:cursor-grabbing">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-65"></div>

        {/* Floating Add Node Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="absolute top-6 right-6 z-30 w-14 h-14 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white shadow-2xl shadow-rose-500/40 flex items-center justify-center transition cursor-pointer hover:scale-105"
          title="Tambah Node Baru"
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* Render Nodes */}
        {nodes.map(node => {
          const IconComp = node.icon || Database;
          const isSelected = selectedNode?.id === node.id;
          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              className={`absolute w-44 bg-slate-900 border rounded-2xl p-4 shadow-xl cursor-pointer transition transform hover:scale-[1.02] flex flex-col items-center text-center group ${
                isSelected ? 'border-rose-500 ring-4 ring-rose-500/20 shadow-rose-500/10' : 'border-slate-700/80 hover:border-slate-600'
              }`}
            >
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-900 group-hover:bg-rose-500 transition"></div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-900 group-hover:bg-rose-500 transition"></div>

              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 mb-2 shadow-inner">
                <IconComp className="w-6 h-6" />
              </div>
              <div className="font-bold text-white text-xs truncate w-full">{node.label}</div>
              <div className="text-[10px] text-slate-400 capitalize mt-0.5">{node.category}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 bg-slate-900/90 backdrop-blur border border-slate-800 px-6 py-3 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1.5 border-r border-slate-800 pr-4">
          <button className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"><Maximize2 className="w-4 h-4" /></button>
          <button className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"><ZoomIn className="w-4 h-4" /></button>
          <button className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"><ZoomOut className="w-4 h-4" /></button>
          <button className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"><RotateCcw className="w-4 h-4" /></button>
        </div>

        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-sm shadow-xl shadow-rose-500/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Play className={`w-4 h-4 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
          {isExecuting ? 'Mengeksekusi Workflow...' : 'Execute Workflow'}
        </button>
      </div>

      {/* Execution Log Modal / Drawer if executing */}
      {execLogs.length > 0 && (
        <div className="absolute bottom-24 right-6 z-40 w-80 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Log Eksekusi Pipeline
            </h4>
            <button onClick={() => setExecLogs([])} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto text-[11px] font-mono text-slate-300">
            {execLogs.map((log, idx) => (
              <div key={idx} className="py-0.5 border-b border-slate-800/40">• {log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Node */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Tambah Node Integrasi Data</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Node / Layanan</label>
                <input
                  type="text"
                  value={newNodeType}
                  onChange={e => setNewNodeType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="Contoh: SAP ERP Connector"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Kategori Node</label>
                <select
                  value={newNodeCategory}
                  onChange={e => setNewNodeCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="trigger">Trigger (Pemicu Jadwal/Webhook)</option>
                  <option value="source">Data Source (Sumber Data)</option>
                  <option value="transform">Transform (Pengolahan/Logic)</option>
                  <option value="action">Action (Aksi/Notifikasi)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800">Batal</button>
              <button onClick={handleAddNode} className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow cursor-pointer">Tambah ke Canvas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
