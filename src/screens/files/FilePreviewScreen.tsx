// ---------------------------------------------------------------------------
// In-app preview for uploaded and generated files.
//   image          -> <Image>
//   pdf            -> react-native-pdf
//   docx/xlsx/pptx -> the server-rendered PDF (/preview), so the phone never
//                     parses Office files; falls back to "Open in…"
//   txt/csv/md     -> text / markdown
// "Open in…" hands the original file to the phone's viewer (Quick Look on
// iOS, an installed app on Android), which also offers save and share.
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Pdf from 'react-native-pdf';
import { viewDocument } from '@react-native-documents/viewer';
import { downloadToCache, filePaths, readCachedText, toFileUri } from '../../api/files';
import { AssistantMarkdown } from '../../components/chat/AssistantMarkdown';
import { ExternalLinkIcon } from '../../components/Icons';
import { Button } from '../../components/ui/Button';
import { useCachedFile } from '../../hooks/useCachedFile';
import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { formatBytes, mimeTypeOf, previewKindOf } from '../../utils/files';

type Props = NativeStackScreenProps<AppStackParamList, 'FilePreview'>;

export function FilePreviewScreen({ navigation, route }: Props) {
  const { source, id, filename, size } = route.params;
  const kind = previewKindOf(filename);
  const originalPath = source === 'generated' ? filePaths.generatedContent(id) : filePaths.uploadedContent(id);
  const originalKey = `${source === 'generated' ? 'gen' : 'up'}_${id}`;

  // Office files preview through the server's PDF render; everything else
  // previews from the original bytes.
  const preview = useCachedFile(
    kind === 'unsupported' ? null : kind === 'office' ? filePaths.renderedPdf(source, id) : originalPath,
    kind === 'office' ? `pdf_${source}_${id}` : originalKey,
    kind === 'office' ? `${filename}.pdf` : filename,
  );

  const [opening, setOpening] = useState(false);

  async function openExternally() {
    setOpening(true);
    try {
      const path = await downloadToCache(originalPath, originalKey, filename);
      await viewDocument({ uri: toFileUri(path), mimeType: mimeTypeOf(filename), headerTitle: filename, grantPermissions: 'read' });
    } catch (err: any) {
      Alert.alert('Could not open the file', err?.message || 'No app on this device can open this file.');
    } finally {
      setOpening(false);
    }
  }

  useEffect(() => {
    const headerRight = () => <HeaderOpenButton busy={opening} onPress={openExternally} />;
    navigation.setOptions({ title: filename, headerRight });
    // openExternally only closes over route params, which do not change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, filename, opening]);

  const fallback = (message: string) => (
    <View style={styles.center}>
      <Text style={styles.name}>{filename}</Text>
      {size ? <Text style={styles.meta}>{formatBytes(size)}</Text> : null}
      <Text style={styles.message}>{message}</Text>
      <Button title="Open in another app" onPress={openExternally} loading={opening} style={styles.openBtn} />
    </View>
  );

  if (kind === 'unsupported') return fallback('This file type can’t be previewed in the app.');
  if (preview.error) {
    return fallback(kind === 'office' ? 'A preview isn’t available for this document.' : preview.error);
  }
  if (!preview.path) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }

  const uri = toFileUri(preview.path);
  if (kind === 'image') {
    return (
      <View style={styles.imageWrap}>
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>
    );
  }
  if (kind === 'pdf' || kind === 'office') {
    return (
      <Pdf
        source={{ uri }}
        style={styles.pdf}
        trustAllCerts={false}
        onError={() => Alert.alert('Could not display the file', 'Try “Open in another app” instead.')}
      />
    );
  }
  return <TextPreview path={preview.path} markdown={kind === 'markdown'} />;
}

function HeaderOpenButton({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  if (busy) return <ActivityIndicator color={colors.ink} />;
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel="Open in another app">
      <ExternalLinkIcon size={22} color={colors.ink} />
    </Pressable>
  );
}

function TextPreview({ path, markdown }: { path: string; markdown: boolean }) {
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    readCachedText(path)
      .then(setText)
      .catch(() => setText(''));
  }, [path]);
  if (text === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }
  return (
    <ScrollView style={styles.textWrap} contentContainerStyle={styles.textContent}>
      {markdown ? <AssistantMarkdown content={text} /> : <Text style={styles.mono} selectable>{text}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bgApp },
  name: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink, textAlign: 'center' },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted, marginTop: 4 },
  message: { fontFamily: fonts.regular, fontSize: 15, color: colors.inkMuted, textAlign: 'center', marginTop: 14 },
  openBtn: { marginTop: 20, alignSelf: 'stretch' },
  imageWrap: { flex: 1, backgroundColor: colors.brandNavy },
  image: { flex: 1 },
  pdf: { flex: 1, backgroundColor: colors.bgPanel },
  textWrap: { flex: 1, backgroundColor: colors.bgCard },
  textContent: { padding: 16 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 13, lineHeight: 19, color: colors.ink },
});
