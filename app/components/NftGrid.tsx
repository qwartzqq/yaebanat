"use client";

import { ImageIcon, ExternalLink } from "lucide-react";
import { shortAddr } from "./utils";

export function NftGrid({ nfts }: { nfts: any[] }) {
  if (!Array.isArray(nfts) || nfts.length === 0) return <div className="text-white/45">No collectibles.</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {nfts.map((it, i) => {
        const name = it?.metadata?.name || it?.name || "NFT";
        const img = it?.metadata?.image || it?.previews?.[0]?.url || it?.image?.original || it?.image || "";
        const addr = String(it?.address || it?.nft_address || "");
        const url = addr ? `https://tonviewer.com/${encodeURIComponent(addr)}` : null;

        return (
          <a
            key={i}
            href={url || "#"}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden hover:bg-white/10 transition"
          >
            <div className="aspect-square bg-black/30 relative">
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={name} className="h-full w-full object-cover group-hover:scale-[1.03] transition" />
              ) : (
                <div className="h-full w-full grid place-items-center text-white/30">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {url && (
                <div className="absolute top-2 right-2 rounded-xl border border-white/10 bg-black/40 px-2 py-1 flex items-center gap-1 text-xs text-white/80">
                  <ExternalLink className="h-3 w-3" />
                  Open
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-white/90 text-sm font-medium truncate">{name}</div>
              <div className="text-white/40 text-xs">{addr ? shortAddr(addr) : "—"}</div>
            </div>
          </a>
        );
      })}
    </div>
  );
}
