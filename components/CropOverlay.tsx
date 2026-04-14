import React, { useState, useRef, useMemo } from 'react';
import { View, PanResponder, StyleSheet, Pressable, Text } from 'react-native';
import { MaterialIcons } from './SafeIcons';

const MIN_SIZE = 60;
const CORNER_VIS = 22;
const HIT_AREA = 48;

interface CropOverlayProps {
  imageRect: { x: number; y: number; width: number; height: number };
  onConfirm: (crop: { x: number; y: number; w: number; h: number }) => void;
  onCancel: () => void;
  primaryColor: string;
}

export default function CropOverlay({ imageRect, onConfirm, onCancel, primaryColor }: CropOverlayProps) {
  const initW = imageRect.width * 0.8;
  const initH = imageRect.height * 0.8;
  const [crop, setCrop] = useState({
    x: imageRect.x + (imageRect.width - initW) / 2,
    y: imageRect.y + (imageRect.height - initH) / 2,
    w: initW,
    h: initH,
  });

  const cropRef = useRef(crop);
  cropRef.current = crop;
  const startCropRef = useRef(crop);

  const cl = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  // Move entire crop box
  const movePan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
    onPanResponderGrant: () => { startCropRef.current = { ...cropRef.current }; },
    onPanResponderMove: (_, gs) => {
      const s = startCropRef.current;
      const nx = cl(s.x + gs.dx, imageRect.x, imageRect.x + imageRect.width - s.w);
      const ny = cl(s.y + gs.dy, imageRect.y, imageRect.y + imageRect.height - s.h);
      const next = { x: nx, y: ny, w: s.w, h: s.h };
      cropRef.current = next;
      setCrop(next);
    },
  }), [imageRect]);

  const makeCornerPan = (corner: 'tl' | 'tr' | 'bl' | 'br') => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { startCropRef.current = { ...cropRef.current }; },
    onPanResponderMove: (_, gs) => {
      const s = startCropRef.current;
      const maxR = imageRect.x + imageRect.width;
      const maxB = imageRect.y + imageRect.height;
      let nx = s.x, ny = s.y, nw = s.w, nh = s.h;

      if (corner === 'tl') {
        const rawX = s.x + gs.dx;
        const rawY = s.y + gs.dy;
        nx = cl(rawX, imageRect.x, s.x + s.w - MIN_SIZE);
        ny = cl(rawY, imageRect.y, s.y + s.h - MIN_SIZE);
        nw = s.x + s.w - nx;
        nh = s.y + s.h - ny;
      } else if (corner === 'tr') {
        const rawY = s.y + gs.dy;
        ny = cl(rawY, imageRect.y, s.y + s.h - MIN_SIZE);
        nw = cl(s.w + gs.dx, MIN_SIZE, maxR - s.x);
        nh = s.y + s.h - ny;
      } else if (corner === 'bl') {
        const rawX = s.x + gs.dx;
        nx = cl(rawX, imageRect.x, s.x + s.w - MIN_SIZE);
        nw = s.x + s.w - nx;
        nh = cl(s.h + gs.dy, MIN_SIZE, maxB - s.y);
      } else {
        nw = cl(s.w + gs.dx, MIN_SIZE, maxR - s.x);
        nh = cl(s.h + gs.dy, MIN_SIZE, maxB - s.y);
      }

      const next = { x: nx, y: ny, w: nw, h: nh };
      cropRef.current = next;
      setCrop(next);
    },
  });

  const tlPan = useMemo(() => makeCornerPan('tl'), [imageRect]);
  const trPan = useMemo(() => makeCornerPan('tr'), [imageRect]);
  const blPan = useMemo(() => makeCornerPan('bl'), [imageRect]);
  const brPan = useMemo(() => makeCornerPan('br'), [imageRect]);

  const handleConfirm = () => {
    onConfirm({
      x: crop.x - imageRect.x,
      y: crop.y - imageRect.y,
      w: crop.w,
      h: crop.h,
    });
  };

  const third1 = crop.h / 3;
  const third2 = (crop.h / 3) * 2;
  const thirdW1 = crop.w / 3;
  const thirdW2 = (crop.w / 3) * 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark mask */}
      <View style={[s.mask, { top: 0, left: 0, right: 0, height: Math.max(0, crop.y) }]} pointerEvents="none" />
      <View style={[s.mask, { top: crop.y + crop.h, left: 0, right: 0, bottom: 0 }]} pointerEvents="none" />
      <View style={[s.mask, { top: crop.y, left: 0, width: Math.max(0, crop.x), height: crop.h }]} pointerEvents="none" />
      <View style={[s.mask, { top: crop.y, left: crop.x + crop.w, right: 0, height: crop.h }]} pointerEvents="none" />

      {/* Crop box (draggable) */}
      <View
        style={[s.cropBox, { left: crop.x, top: crop.y, width: crop.w, height: crop.h, borderColor: primaryColor }]}
        {...movePan.panHandlers}
      >
        {/* Rule-of-thirds grid */}
        <View style={[s.gridH, { top: third1, borderColor: 'rgba(255,255,255,0.25)' }]} pointerEvents="none" />
        <View style={[s.gridH, { top: third2, borderColor: 'rgba(255,255,255,0.25)' }]} pointerEvents="none" />
        <View style={[s.gridV, { left: thirdW1, borderColor: 'rgba(255,255,255,0.25)' }]} pointerEvents="none" />
        <View style={[s.gridV, { left: thirdW2, borderColor: 'rgba(255,255,255,0.25)' }]} pointerEvents="none" />

        {/* Dimension label */}
        <View style={s.dimLabel} pointerEvents="none">
          <Text style={s.dimText}>{Math.round(crop.w)} x {Math.round(crop.h)}</Text>
        </View>
      </View>

      {/* Corner handles - rendered on top */}
      <View
        style={[s.hitArea, { left: crop.x - HIT_AREA / 2, top: crop.y - HIT_AREA / 2 }]}
        {...tlPan.panHandlers}
      >
        <View style={[s.cornerVis, s.cornerTL, { borderColor: primaryColor }]} />
      </View>
      <View
        style={[s.hitArea, { left: crop.x + crop.w - HIT_AREA / 2, top: crop.y - HIT_AREA / 2 }]}
        {...trPan.panHandlers}
      >
        <View style={[s.cornerVis, s.cornerTR, { borderColor: primaryColor }]} />
      </View>
      <View
        style={[s.hitArea, { left: crop.x - HIT_AREA / 2, top: crop.y + crop.h - HIT_AREA / 2 }]}
        {...blPan.panHandlers}
      >
        <View style={[s.cornerVis, s.cornerBL, { borderColor: primaryColor }]} />
      </View>
      <View
        style={[s.hitArea, { left: crop.x + crop.w - HIT_AREA / 2, top: crop.y + crop.h - HIT_AREA / 2 }]}
        {...brPan.panHandlers}
      >
        <View style={[s.cornerVis, s.cornerBR, { borderColor: primaryColor }]} />
      </View>

      {/* Action bar */}
      <View style={s.actionBar}>
        <Pressable style={s.cancelBtn} onPress={onCancel}>
          <MaterialIcons name="close" size={20} color="#fff" />
          <Text style={s.btnText}>Cancel</Text>
        </Pressable>
        <Pressable style={[s.confirmBtn, { backgroundColor: primaryColor }]} onPress={handleConfirm}>
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={s.btnText}>Apply Crop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropBox: {
    position: 'absolute',
    borderWidth: 2,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  dimLabel: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dimText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  hitArea: {
    position: 'absolute',
    width: HIT_AREA,
    height: HIT_AREA,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cornerVis: {
    width: CORNER_VIS,
    height: CORNER_VIS,
    position: 'absolute',
  },
  cornerTL: {
    top: HIT_AREA / 2 - 1,
    left: HIT_AREA / 2 - 1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: HIT_AREA / 2 - 1,
    right: HIT_AREA / 2 - 1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: HIT_AREA / 2 - 1,
    left: HIT_AREA / 2 - 1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: HIT_AREA / 2 - 1,
    right: HIT_AREA / 2 - 1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 4,
  },
  actionBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    height: 48,
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    height: 48,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
