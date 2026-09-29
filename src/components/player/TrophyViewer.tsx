'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Trophy3D from '@/components/player/Trophy3D';
import { TROPHY_LABELS, type TrophyItem } from '@/lib/trophies';

// A trophy up close: a live 3D view you can drag to turn, spinning slowly
// on its own. Falls back to the rendered sheet without WebGL.
export default function TrophyViewer({ item, playerName, onClose }: { item: TrophyItem | null; playerName: string; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!item || !node) return;
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const [THREE, { OrbitControls }, models, sprites] = await Promise.all([
          import('three'),
          import('three/examples/jsm/controls/OrbitControls.js'),
          import('@/lib/trophy-models'),
          import('@/lib/trophy-sprites'),
        ]);
        if (disposed) return;
        const width = node.clientWidth;
        const height = node.clientHeight;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        node.appendChild(renderer.domElement);
        renderer.domElement.style.touchAction = 'none';
        const scene = new THREE.Scene();
        scene.environment = sprites.studioEnvironment(renderer);
        models.lightStudio(scene);
        scene.add(sprites.contactShadow());
        const trophy = models.buildTrophy(item.kind);
        scene.add(trophy);
        const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
        camera.position.set(3.2, 3.2, 8.4);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 2, 0);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minDistance = 5;
        controls.maxDistance = 14;
        controls.minPolarAngle = 0.35;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotateSpeed = 1.6;
        let frame = 0;
        const tick = () => {
          controls.update();
          renderer.render(scene, camera);
          frame = requestAnimationFrame(tick);
        };
        tick();
        const onResize = () => {
          camera.aspect = node.clientWidth / node.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(node.clientWidth, node.clientHeight);
        };
        window.addEventListener('resize', onResize);
        cleanup = () => {
          cancelAnimationFrame(frame);
          window.removeEventListener('resize', onResize);
          controls.dispose();
          models.disposeObject(scene);
          scene.environment?.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setFailed(true);
      }
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, [item, node]);

  const label = item ? TROPHY_LABELS[item.kind] : null;

  return (
    <Dialog
      open={Boolean(item)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ transition: { onExited: () => setFailed(false) }, paper: { sx: { overflow: 'hidden', background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(245, 158, 11, 0.18), transparent 70%), linear-gradient(180deg, #2D1620, #12080C)' } } }}
    >
      {item && label && (
        <Box sx={{ position: 'relative' }}>
          <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}><CloseIcon /></IconButton>
          <Box
            ref={setNode}
            role="img"
            aria-label={`${label.name} trophy, ${item.tournamentName}. Drag to turn it.`}
            sx={{ height: { xs: 340, sm: 420 }, cursor: 'grab', '&:active': { cursor: 'grabbing' }, display: 'grid', placeItems: 'center' }}
          >
            {failed && <Trophy3D kind={item.kind} width={200} spinning />}
          </Box>
          <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#F59E0B' }}>{item.tournamentName}</Typography>
            <Typography component="h2" sx={{ fontSize: '1.75rem', fontWeight: 700 }}>{label.name}</Typography>
            <Typography color="text.secondary">{playerName} · {label.description} · {item.detail}</Typography>
          </Box>
        </Box>
      )}
    </Dialog>
  );
}
