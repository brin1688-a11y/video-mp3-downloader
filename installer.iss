; Inno Setup script -> installer\VideoDownloader-Setup-<version>.exe
; Build with build_installer.bat (runs PyInstaller first, then this script)

#define AppName "Video & MP3 Downloader"
#define AppVersion "1.2.0"
#define AppExe "VideoDownloader.exe"

[Setup]
AppId={{6F3C2A51-8B7E-4D2A-9C1F-5E8A7B2D4C90}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher=Sborinn
DefaultDirName={autopf}\VideoDownloader
DefaultGroupName={#AppName}
UninstallDisplayIcon={app}\{#AppExe}
SetupIconFile=icon.ico
OutputDir=installer
OutputBaseFilename=VideoDownloader-Setup-{#AppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
; No admin needed by default; users can still choose "install for all users"
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
CloseApplications=yes

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "dist\VideoDownloader\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExe}"
Name: "{group}\{cm:UninstallProgram,{#AppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExe}"; Description: "{cm:LaunchProgram,{#AppName}}"; Flags: nowait postinstall skipifsilent
