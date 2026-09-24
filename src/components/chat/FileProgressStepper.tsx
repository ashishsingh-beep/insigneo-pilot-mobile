// Vertical progress track shown while a file is generated in the sandbox —
// driven by the backend's file_progress events. Ported from Chat.jsx.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FileProgress } from '../../stores/chatStore';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';

const STEP_ORDER = ['preparing', 'designing', 'rendering', 'verifying', 'done'];
const STEP_LABELS: Record<string, string> = {
  preparing: 'Preparing',
  designing: 'Designing the document',
  rendering: 'Rendering in a secure sandbox',
  verifying: 'Verifying the result',
  done: 'Ready to download',
};

const formatTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export function FileProgressStepper({ progress }: { progress: FileProgress }) {
  const files = Object.values(progress.files);
  const anyActive = files.some((f) => f.current !== 'done' && f.current !== 'failed');

  // Local 1s ticker so elapsed time keeps moving even if backend events stall.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!anyActive) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [anyActive]);

  if (files.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {files.map((f, i) => {
        const failed = f.current === 'failed';
        // "refining" is a retry of code generation — it sits on the "designing" step.
        const activeStage = f.current === 'refining' ? 'designing' : f.current;
        const pos = STEP_ORDER.indexOf(activeStage);
        return (
          <View key={i} style={styles.file}>
            <View style={styles.head}>
              <Text style={styles.fmt}>{(f.fmt || 'file').toUpperCase()}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {f.filename}
              </Text>
              {files.length > 1 ? <Text style={styles.count}>{`${i + 1}/${files.length}`}</Text> : null}
            </View>
            {failed ? (
              <Text style={styles.failed}>Couldn’t generate this file — please try again.</Text>
            ) : (
              STEP_ORDER.map((step, si) => {
                const state = si < pos ? 'done' : si === pos ? (step === 'done' ? 'done' : 'active') : 'pending';
                let label = STEP_LABELS[step];
                if (step === 'designing' && f.current === 'refining' && f.attempt) {
                  label = `Refining (attempt ${f.attempt})`;
                }
                let sub: string | null = null;
                if (state === 'active') {
                  if (step === 'designing') {
                    sub = f.tokensOut
                      ? `Writing document code… ~${formatTokens(f.tokensOut)} tokens`
                      : 'Writing document code…';
                  } else if (step === 'rendering') {
                    sub = `Running in secure sandbox… ${Math.max(0, Math.round((now - f.stageStartedAt) / 1000))}s`;
                  }
                  if (now - f.lastEventAt > 8000) sub = `${sub ? `${sub} — ` : ''}still working…`;
                }
                return (
                  <View key={step} style={styles.step}>
                    <View
                      style={[
                        styles.dot,
                        state === 'done' && styles.dotDone,
                        state === 'active' && styles.dotActive,
                      ]}
                    />
                    <View style={styles.stepText}>
                      <Text style={[styles.label, state === 'pending' && styles.labelPending]}>{label}</Text>
                      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginVertical: 6 },
  file: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  fmt: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.white,
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  name: { flex: 1, fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  count: { fontFamily: fonts.medium, fontSize: 12, color: colors.inkMuted },
  failed: { fontFamily: fonts.regular, fontSize: 14, color: colors.danger },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgCard,
  },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotActive: { borderColor: colors.brandBlue, backgroundColor: colors.brandSky },
  stepText: { flex: 1 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  labelPending: { color: colors.inkFaint },
  sub: { fontFamily: fonts.regular, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
});
