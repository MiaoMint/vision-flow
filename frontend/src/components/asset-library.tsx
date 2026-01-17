import { useState, useEffect, useRef } from "react";
import { database } from "../../wailsjs/go/models";
import { ListAssets, DeleteAsset, DownloadAssetFile } from "../../wailsjs/go/database/Service";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, FileImage, FileVideo, FileAudio, Download } from "lucide-react";
import { toast } from "sonner";
import { msg } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useLingui } from "@lingui/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export function AssetLibrary() {
    const { _ } = useLingui();
    const [assets, setAssets] = useState<database.Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewAsset, setPreviewAsset] = useState<database.Asset | null>(null);

    const fetchAssets = async () => {
        try {
            const result = await ListAssets(0); // 0 means all assets
            setAssets(result || []);
        } catch (err) {
            console.error("Failed to fetch assets:", err);
            toast.error(_(msg`Failed to load assets`));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        try {
            await DeleteAsset(id);
            setAssets(assets.filter((a) => a.id !== id));
            toast.success(_(msg`Asset deleted`));
            if (previewAsset?.id === id) {
                setPreviewAsset(null);
            }
        } catch (err) {
            console.error("Failed to delete asset:", err);
            toast.error(_(msg`Failed to delete`));
        }
    };

    const handleSave = async (e: React.MouseEvent, asset: database.Asset) => {
        e.stopPropagation();
        try {
            await DownloadAssetFile(asset.path);
            toast.success(_(msg`Asset saved`));
        } catch (err) {
            console.error("Failed to save asset:", err);
            toast.error(_(msg`Failed to save`));
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight"><Trans>Assets</Trans></h2>
                <span className="text-muted-foreground text-sm">
                    <Trans>Total {assets.length} assets</Trans>
                </span>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square rounded-lg bg-muted animate-pulse"
                        />
                    ))}
                </div>
            ) : assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-4">
                    <FileImage className="w-16 h-16 opacity-20" />
                    <p><Trans>No assets yet. Generated content in workflows will appear here</Trans></p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                    {assets.map((asset) => (
                        <Card
                            key={asset.id}
                            className="group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all border-none shadow-sm py-0"
                            onClick={() => setPreviewAsset(asset)}
                        >
                            <CardContent className="p-0 relative">
                                <AssetPreview asset={asset} />
                                <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:text-primary hover:bg-primary/10 bg-background/50 backdrop-blur-sm"
                                        onClick={(e) => handleSave(e, asset)}
                                    >
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:text-destructive hover:bg-destructive/10 bg-background/50 backdrop-blur-sm"
                                        onClick={(e) => handleDelete(e, asset.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>

                        </Card>
                    ))}
                </div>
            )
            }

            {/* Asset Preview Dialog */}
            <Dialog
                open={!!previewAsset}
                onOpenChange={(open) => !open && setPreviewAsset(null)}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-sm">
                    <DialogHeader className="p-4 border-b">
                        <DialogTitle><Trans>Asset Preview</Trans></DialogTitle>
                        <DialogDescription>
                            {previewAsset?.type} - {previewAsset?.path}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/10 min-h-75">
                        {previewAsset && (
                            <>
                                {previewAsset.type === "image" && (
                                    <img
                                        src={previewAsset.url}
                                        alt="Preview"
                                        className="max-w-full max-h-[70vh] object-contain rounded-md shadow-lg"
                                    />
                                )}
                                {previewAsset.type === "video" && (
                                    <video
                                        src={previewAsset.url}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-[70vh] rounded-md shadow-lg"
                                    />
                                )}
                                {previewAsset.type === "audio" && (
                                    <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-lg flex flex-col items-center gap-4">
                                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                            <FileAudio className="w-12 h-12 text-primary" />
                                        </div>
                                        <audio
                                            src={previewAsset.url}
                                            controls
                                            autoPlay
                                            className="w-full"
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2 bg-muted/30">
                        <Button variant="outline" onClick={(e) => {
                            if (previewAsset) {
                                handleSave(e as any, previewAsset);
                            }
                        }}><Trans>Save</Trans></Button>
                        <Button variant="outline" onClick={() => setPreviewAsset(null)}><Trans>Close</Trans></Button>
                        <Button variant="destructive" onClick={(e) => {
                            if (previewAsset) {
                                handleDelete(e as any, previewAsset.id);
                            }
                        }}><Trans>Delete</Trans></Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}

function AssetPreview({ asset }: { asset: database.Asset }) {
    const url = asset.url;
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleMouseEnter = () => {
        if (asset.type === "video" && videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
        } else if (asset.type === "audio" && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
        }
    };

    const handleMouseLeave = () => {
        if (asset.type === "video" && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        } else if (asset.type === "audio" && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    switch (asset.type) {
        case "image":
            return (
                <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted/20">
                    <img
                        src={url}
                        alt="Asset"
                        className="w-full h-full object-cover"
                    />
                </div>
            );
        case "video":
            return (
                <div
                    className="aspect-square relative overflow-hidden rounded-t-lg bg-muted/20 flex items-center justify-center transition-colors hover:bg-black/5"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <video
                        ref={videoRef}
                        src={url}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none group-hover:opacity-0 transition-opacity">
                        <FileVideo className="w-12 h-12 text-white/80" />
                    </div>
                </div>
            );
        case "audio":
            return (
                <div
                    className="aspect-square relative overflow-hidden rounded-t-lg bg-muted/20 flex flex-col items-center justify-center gap-2 p-4 transition-colors hover:bg-primary/5"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <FileAudio className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground break-all line-clamp-2 text-center">
                        {asset.path}
                    </span>
                    <audio ref={audioRef} src={url} className="hidden" />
                </div>
            );
        default:
            return (
                <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted/20 flex items-center justify-center">
                    <span className="text-muted-foreground">Unknown Type</span>
                </div>
            );
    }
}
