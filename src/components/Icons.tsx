// ---------------------------------------------------------------------------
// Stroke icons (1.6px, 24px grid) — the same paths as the web app's
// components/Icons.jsx, drawn with react-native-svg.
// ---------------------------------------------------------------------------

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme/colors';

export type IconProps = { size?: number; color?: string; strokeWidth?: number };

function icon(draw: (color: string) => React.ReactNode) {
  return function Icon({ size = 20, color = colors.ink, strokeWidth = 1.6 }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {draw(color)}
      </Svg>
    );
  };
}

export const MailIcon = icon(() => (
  <>
    <Rect x="3" y="5" width="18" height="14" rx="2" />
    <Path d="m3 7 9 6 9-6" />
  </>
));

export const LockIcon = icon(() => (
  <>
    <Rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </>
));

export const EyeIcon = icon(() => (
  <>
    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
    <Circle cx="12" cy="12" r="3" />
  </>
));

export const EyeOffIcon = icon(() => (
  <>
    <Path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-2.6 3.4M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8" />
    <Path d="m9.5 9.5a3 3 0 0 0 4.2 4.2" />
    <Path d="m3 3 18 18" />
  </>
));

export const PlusIcon = icon(() => <Path d="M12 5v14M5 12h14" />);

export const HistoryIcon = icon(() => (
  <>
    <Path d="M3 3v5h5" />
    <Path d="M3.5 8a9 9 0 1 0 2.3-3.3L3 8" />
    <Path d="M12 7v5l3.5 2" />
  </>
));

export const UserIcon = icon(() => (
  <>
    <Circle cx="12" cy="9" r="3.2" />
    <Path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    <Circle cx="12" cy="12" r="9.2" />
  </>
));

export const PaperclipIcon = icon(() => (
  <Path d="M21 11.5 12.2 20a5 5 0 0 1-7-7l8.5-8.6a3.3 3.3 0 1 1 4.7 4.7l-8.5 8.5a1.6 1.6 0 0 1-2.3-2.3l7.8-7.8" />
));

export const ArrowUpIcon = icon(() => <Path d="M12 19V5M6 11l6-6 6 6" />);

export const ArrowLeftIcon = icon(() => <Path d="M19 12H5M11 18l-6-6 6-6" />);

export const DocumentIcon = icon(() => (
  <>
    <Path d="M7 3h7l4 4v14H7z" />
    <Path d="M14 3v4h4" />
    <Path d="M9.5 12h5M9.5 15.5h5" />
  </>
));

export const ChartIcon = icon(() => (
  <>
    <Path d="M4 19V5M4 19h16" />
    <Path d="m7 15 3-4 3 2 4-6" />
  </>
));

export const MenuIcon = icon(() => <Path d="M4 7h16M4 12h16M4 17h10" />);

export const GlobeIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M2 12h20M12 2a9.5 9.5 0 0 1 0 20 9.5 9.5 0 0 1 0-20" />
    <Path d="M12 2c2 4 2 8 2 10s0 6-2 10M12 2c-2 4-2 8-2 10s0 6 2 10" />
  </>
));

export const ModelIcon = icon(() => (
  <>
    <Rect x="4" y="4" width="16" height="16" rx="2" />
    <Path d="M9 9h6v6H9z" />
    <Path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
  </>
));

export const ChevronDownIcon = icon(() => <Path d="m6 9 6 6 6-6" />);

export const ChevronRightIcon = icon(() => <Path d="m9 6 6 6-6 6" />);

export const ImageIcon = icon(() => (
  <>
    <Rect x="3" y="4.5" width="18" height="15" rx="2" />
    <Circle cx="8.5" cy="9.5" r="1.6" />
    <Path d="m3.5 17 4.8-4.6a2 2 0 0 1 2.7 0L15 16.5" />
    <Path d="m13.5 15 2.2-2.1a2 2 0 0 1 2.7 0l2.1 2" />
  </>
));

export const CameraIcon = icon(() => (
  <>
    <Path d="M4 8.5a2 2 0 0 1 2-2h1.8l1.4-2h5.6l1.4 2H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    <Circle cx="12" cy="12.5" r="3.3" />
  </>
));

export const DownloadIcon = icon(() => (
  <>
    <Path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
    <Path d="M5 19h14" />
  </>
));

export const CloseIcon = icon(() => <Path d="m6 6 12 12M18 6 6 18" />);

export const SheetIcon = icon(() => (
  <>
    <Rect x="3" y="4.5" width="18" height="15" rx="2" />
    <Path d="M3 9.5h18M3 14.5h18M9 4.5v15M15 4.5v15" />
  </>
));

export const SlidesIcon = icon(() => (
  <>
    <Rect x="3" y="4.5" width="18" height="12" rx="2" />
    <Path d="M12 16.5V20M8.5 20h7" />
  </>
));

export const TrashIcon = icon(() => (
  <>
    <Path d="M4 6.5h16" />
    <Path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5" />
    <Path d="M6.5 6.5 7.3 19a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12.5" />
    <Path d="M10.5 10v6.5M13.5 10v6.5" />
  </>
));

export const PencilIcon = icon(() => (
  <>
    <Path d="M4 20h4.2L19.6 8.6a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4 15.8Z" />
    <Path d="m14.5 5.5 4 4" />
  </>
));

export const CopyIcon = icon(() => (
  <>
    <Rect x="8" y="8" width="12" height="12" rx="2" />
    <Path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </>
));

export const CheckIcon = icon(() => <Path d="m5 12.5 4.5 4.5L19 7.5" />);

export const StopIcon = icon((color) => <Rect x="7" y="7" width="10" height="10" rx="1.5" fill={color} stroke="none" />);

export const ExternalLinkIcon = icon(() => (
  <>
    <Path d="M14 4h6v6" />
    <Path d="M20 4 10.5 13.5" />
    <Path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </>
));

export const LogoutIcon = icon(() => (
  <>
    <Path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <Path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </>
));

export const ProjectIcon = icon(() => (
  <>
    <Path d="M3 7.5a2 2 0 0 1 2-2h3.6a2 2 0 0 1 1.5.7l1.1 1.3H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    <Path d="M3 11h18" />
  </>
));

export const BookIcon = icon(() => (
  <>
    <Path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15H5.5A1.5 1.5 0 0 0 4 19.5Z" />
    <Path d="M4 19.5A1.5 1.5 0 0 1 5.5 18H19v3H5.5A1.5 1.5 0 0 1 4 19.5Z" />
    <Path d="M8 7.5h7M8 11h5" />
  </>
));

export const SparkIcon = icon(() => (
  <>
    <Path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" />
    <Path d="M18 16.5 18.7 18.8 21 19.5 18.7 20.2 18 22.5 17.3 20.2 15 19.5 17.3 18.8Z" />
  </>
));

export const HelpIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M9.5 9.5a2.5 2.5 0 0 1 4.6 1.3c0 1.7-2.6 2-2.6 3.7" />
    <Path d="M12 17.5h.01" />
  </>
));

export const TicketIcon = icon(() => (
  <>
    <Path d="M3 9.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" />
    <Path d="M13 5v3M13 11v2M13 16v3" />
  </>
));

export const SendIcon = icon(() => (
  <>
    <Path d="M21 3 10.5 13.5" />
    <Path d="M21 3 14.5 21l-4-7.5L3 9.5Z" />
  </>
));

export const CheckCircleIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="9" />
    <Path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </>
));

export const LinkIcon = icon(() => (
  <>
    <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </>
));

export const FileTypeIcon = ({ filename, ...props }: IconProps & { filename: string }) => {
  const name = filename.toLowerCase();
  if (/\.(png|jpe?g|jfif|gif|webp)$/.test(name)) return <ImageIcon {...props} />;
  if (/\.(xlsx|csv)$/.test(name)) return <SheetIcon {...props} />;
  if (/\.pptx$/.test(name)) return <SlidesIcon {...props} />;
  return <DocumentIcon {...props} />;
};
