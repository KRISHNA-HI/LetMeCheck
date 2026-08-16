import React from 'react';
import {
  Layers,
  BookOpen,
  Film,
  Tv,
  Sparkles,
  CheckCircle2,
  Clock,
  Circle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Manga, MangaMaterial, MaterialStatus, MaterialType } from '../../types';
import { useLibrary } from '../../hooks/useLibrary';
import { getMaterialTypeBadgeClass, getDisplayTitle } from '../../utils/formatters';

interface MaterialGuideProps {
  manga: Manga;
}

const MATERIAL_TYPE_ICONS: Record<string, React.ElementType> = {
  Manga: BookOpen,
  Manhwa: BookOpen,
  Manhua: BookOpen,
  'Light Novel': BookOpen,
  Anime: Tv,
  Movie: Film,
  OVA: Film,
  Special: Sparkles,
  'One-shot': Sparkles,
  Other: Layers
};

export const MaterialGuide: React.FC<MaterialGuideProps> = ({ manga }) => {
  const { allMaterialProgress, updateMaterialStatus } = useLibrary();

  // If manga doesn't have materials list, generate a baseline representation
  const materials: MangaMaterial[] = manga.materials && manga.materials.length > 0
    ? manga.materials
    : [
        {
          id: `mat-main-${manga.id}`,
          type: manga.type,
          title: `${getDisplayTitle(manga)} (Main Work)`,
          number: manga.chapters ? `${manga.chapters} Chapters` : manga.volumes ? `${manga.volumes} Volumes` : 'Ongoing',
          release_date: manga.release_year ? `${manga.release_year}` : undefined
        }
      ];

  // Group materials by Type
  const groupedMaterials = materials.reduce<Record<string, MangaMaterial[]>>((acc, item) => {
    const key = item.type || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const typeOrder: MaterialType[] = [
    'Manga',
    'Manhwa',
    'Manhua',
    'Light Novel',
    'Anime',
    'Movie',
    'OVA',
    'Special',
    'One-shot',
    'Other'
  ];

  const sortedGroups = Object.keys(groupedMaterials).sort((a, b) => {
    const idxA = typeOrder.indexOf(a as MaterialType);
    const idxB = typeOrder.indexOf(b as MaterialType);
    return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
  });

  const getStatusIcon = (status: MaterialStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'In Progress':
        return <Clock className="w-4 h-4 text-sky-400" />;
      case 'Pending':
      default:
        return <Circle className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getStatusButtonClass = (isActive: boolean, status: MaterialStatus) => {
    if (!isActive) return 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800';
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold';
      case 'In Progress':
        return 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold';
      case 'Pending':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold';
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col gap-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-100">Material & Adaptation Guide</h3>
            <p className="text-xs text-zinc-400">
              Complete tree of all published works, media adaptations, side stories, and user progress
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 self-end sm:self-auto">
          <span className="font-mono bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
            {materials.length} Entries
          </span>
        </div>
      </div>

      {/* Materials Tree List */}
      <div className="flex flex-col gap-6">
        {sortedGroups.map((typeKey) => {
          const items = groupedMaterials[typeKey];
          const GroupIcon = MATERIAL_TYPE_ICONS[typeKey] || Layers;

          return (
            <div key={typeKey} className="flex flex-col gap-3">
              {/* Type Category Header */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <GroupIcon className="w-3.5 h-3.5 text-sky-400" />
                <span>{typeKey} Works</span>
                <span className="text-[10px] text-zinc-500 font-mono font-normal">({items.length})</span>
                <div className="flex-1 h-px bg-zinc-800 ml-2" />
              </div>

              {/* Items in Category */}
              <div className="grid grid-cols-1 gap-2.5 pl-2 sm:pl-4 border-l-2 border-zinc-800">
                {items.map((mat) => {
                  const currentProg = allMaterialProgress[mat.id];
                  const currentStatus: MaterialStatus = currentProg?.status || 'Pending';

                  return (
                    <div
                      key={mat.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-all gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">{getStatusIcon(currentStatus)}</div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-sky-300 transition-colors">
                              {mat.title}
                            </span>
                            {mat.number && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-mono">
                                {mat.number}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 flex-wrap mt-0.5">
                            {mat.release_date && <span>Released: {mat.release_date}</span>}
                            {mat.description && (
                              <span className="text-zinc-500 line-clamp-1">{mat.description}</span>
                            )}
                            {mat.external_url && (
                              <a
                                href={mat.external_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                              >
                                View Relation <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center gap-1 self-end sm:self-center shrink-0 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        {(['Pending', 'In Progress', 'Completed'] as MaterialStatus[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => updateMaterialStatus(mat.id, st)}
                            className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer ${getStatusButtonClass(
                              currentStatus === st,
                              st
                            )}`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
