/**
 * LPIC-1/2 のカテゴリを公式試験範囲に従って再構成するスクリプト
 *
 * LPIC-1 Exam 101: システムアーキテクチャ / インストール&パッケージ / GNUコマンド / デバイス&FHS
 * LPIC-1 Exam 102: シェル&スクリプト / UI&デスクトップ / 管理タスク / 必須サービス / ネットワーク / セキュリティ
 * LPIC-2 Exam 201: キャパシティ / カーネル / システム起動 / FS&デバイス / ストレージ / ネットワーク設定 / メンテナンス
 * LPIC-2 Exam 202: DNS / Webサービス / ファイル共有 / NWクライアント / メール / セキュリティ
 */
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── 新カテゴリ定義 ──────────────────────────────────────────────
const NEW_CATEGORIES = {
  "LPIC-1": [
    // Exam 101
    "[101] システムアーキテクチャ",
    "[101] Linuxのインストールとパッケージ管理",
    "[101] GNUとUnixコマンド",
    "[101] デバイス・Linuxファイルシステム・FHS",
    // Exam 102
    "[102] シェルとシェルスクリプト",
    "[102] ユーザーインターフェースとデスクトップ",
    "[102] 管理タスク",
    "[102] 必須システムサービス",
    "[102] ネットワークの基礎",
    "[102] セキュリティ",
  ],
  "LPIC-2": [
    // Exam 201
    "[201] キャパシティプランニング",
    "[201] Linuxカーネル",
    "[201] システムの起動",
    "[201] ファイルシステムとデバイス",
    "[201] 高度なストレージ管理",
    "[201] ネットワーク設定",
    "[201] システムのメンテナンス",
    // Exam 202
    "[202] ドメインネームサーバー",
    "[202] HTTPサービス",
    "[202] ファイル共有",
    "[202] ネットワーククライアント管理",
    "[202] メールサービス",
    "[202] システムセキュリティ",
  ],
};

async function main() {
  // ─── 既存 LPIC-1/2 データを削除 ──────────────────────────────
  for (const certName of ["LPIC-1", "LPIC-2"]) {
    const cert = await prisma.certification.findUnique({ where: { name: certName } });
    if (!cert) continue;
    const cats = await prisma.category.findMany({ where: { certificationId: cert.id } });
    const catIds = cats.map((c) => c.id);
    await prisma.flashcard.deleteMany({ where: { categoryId: { in: catIds } } });
    await prisma.question.deleteMany({ where: { categoryId: { in: catIds } } });
    await prisma.category.deleteMany({ where: { id: { in: catIds } } });
    console.log(`✓ ${certName} の旧カテゴリ・データを削除しました`);
  }

  // ─── 新カテゴリ作成 ──────────────────────────────────────────
  const catMap: Record<string, number> = {};
  for (const [certName, categories] of Object.entries(NEW_CATEGORIES)) {
    const cert = await prisma.certification.findUnique({ where: { name: certName } });
    if (!cert) { console.warn(`${certName} が見つかりません`); continue; }
    for (const name of categories) {
      const created = await prisma.category.create({ data: { name, certificationId: cert.id } });
      catMap[`${certName}::${name}`] = created.id;
    }
    console.log(`✓ ${certName} の新カテゴリ ${categories.length} 件を作成しました`);
  }

  const cat = (certName: string, name: string) => {
    const key = `${certName}::${name}`;
    if (!catMap[key]) throw new Error(`カテゴリが見つかりません: ${key}`);
    return catMap[key];
  };

  // ─── LPIC-1 フラッシュカード ─────────────────────────────────
  const flashcards = [
    // ── [101] システムアーキテクチャ ──
    { front: "BIOS と UEFI の違い", back: "BIOS は16ビットリアルモードで動作しMBRから起動。UEFI は32/64ビットで動作しGPTに対応、セキュアブートをサポートする", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "MBR（マスターブートレコード）", back: "ディスク先頭512バイト。ブートローダー（446B）+ パーティションテーブル（64B）+ マジックナンバー（2B）で構成される", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "GRUB 2 の設定ファイル", back: "/boot/grub/grub.cfg（自動生成）。編集は /etc/default/grub を変更後、update-grub を実行", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "systemd のターゲット", back: "SysV の runlevel に相当。multi-user.target（runlevel 3）、graphical.target（5）、rescue.target（1）", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "systemctl コマンド", back: "systemd のサービス管理。start/stop/restart/enable/disable/status。systemctl get-default でデフォルトターゲット確認", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "/proc ディレクトリ", back: "カーネルとプロセスの情報を提供する仮想ファイルシステム。/proc/cpuinfo, /proc/meminfo, /proc/[PID]/ など", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "/sys ディレクトリ", back: "デバイスとカーネルのサブシステム情報を提供する仮想ファイルシステム（sysfs）", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "dmesg コマンド", back: "カーネルのリングバッファ（起動時メッセージ・デバイス検出ログ等）を表示する", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    { front: "lspci / lsusb", back: "接続されているPCI/USBデバイスの一覧を表示する", categoryId: cat("LPIC-1", "[101] システムアーキテクチャ") },
    // ── [101] Linuxのインストールとパッケージ管理 ──
    { front: "apt-get update && apt-get upgrade", back: "パッケージリストを更新後、全パッケージを最新版にアップグレードする（Debian/Ubuntu系）", categoryId: cat("LPIC-1", "[101] Linuxのインストールとパッケージ管理") },
    { front: "apt-get install pkg", back: "パッケージをインストールする。依存関係を自動解決", categoryId: cat("LPIC-1", "[101] Linuxのインストールとパッケージ管理") },
    { front: "apt-get remove / purge pkg", back: "remove: パッケージを削除（設定ファイルは残る）。purge: 設定ファイルも含め完全削除", categoryId: cat("LPIC-1", "[101] Linuxのインストールとパッケージ管理") },
    { front: "dpkg -l / -i / -r", back: "-l: インストール済み一覧。-i: .debインストール。-r: 削除。--list-files pkg: パッケージのファイル一覧", categoryId: cat("LPIC-1", "[101] Linuxのインストールとパッケージ管理") },
    { front: "rpm -ivh / -e / -qa", back: "-ivh: インストール。-e: アンインストール。-qa: 全パッケージ一覧。-qi pkg: パッケージ情報", categoryId: cat("LPIC-1", "[101] Linuxのインストールとパッケージ管理") },
    { front: "yum / dnf install pkg", back: "RPMパッケージをリポジトリから依存関係ごとインストール（Red Hat/CentOS/Fedora系）", categoryId: cat("LPIC-1", "[101] Linuxのインストールとパッケージ管理") },
    // ── [101] GNUとUnixコマンド ──
    { front: "ls -la", back: "隠しファイルを含む全ファイルの詳細一覧（パーミッション・所有者・サイズ・更新日時）を表示する", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "cp -rp src dst", back: "ディレクトリを再帰的にコピーし、タイムスタンプ・パーミッション等の属性を保持する", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "mv / rm -rf", back: "mv: 移動または名前変更。rm -rf: 確認なしで再帰削除（操作ミスに要注意）", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "find . -type f -mtime +7", back: "7日以上前に更新された通常ファイルを検索する。-name '*.log' でパターン指定可", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "ln -s target linkname", back: "シンボリックリンクを作成する。-s なしはハードリンク（同一ファイルシステム内のみ）", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "ps aux", back: "全ユーザーの全プロセスをBSD形式で表示。a=全ユーザー u=ユーザー情報 x=端末なし含む", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "kill -9 PID / killall name", back: "kill -9: SIGKILL で強制終了。kill -15: SIGTERM（終了要求）。killall: 名前でまとめて終了", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "fg / bg / jobs", back: "jobs: ジョブ一覧。fg %1: ジョブ1をフォアグラウンドへ。bg %1: バックグラウンドで再開", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "nice / renice", back: "nice -n 10 cmd: 優先度を下げて実行。renice -n 5 -p PID: 実行中プロセスの優先度変更。nice値 -20（高）〜 19（低）", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "grep -r / -v / -c", back: "-r: 再帰検索。-v: 逆マッチ（不一致行）。-c: マッチ行数。-i: 大文字小文字無視", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "sed 's/old/new/g'", back: "ストリームエディタ。g で全置換、-i でファイル直接編集。'd' でマッチ行削除", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "awk '{print $2}' -F:", back: "フィールド処理ツール。$2 は第2フィールド。-F: でコロン区切り。END{} でまとめ処理", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "sort -n / -k2 / -r", back: "-n: 数値順。-k2: 第2フィールドでソート。-r: 逆順。uniq -c と組み合わせて頻度集計", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "wc -l / cut -d: -f1 / tr", back: "wc -l: 行数。cut -d: -f1: コロン区切り第1フィールド抽出。tr 'a-z' 'A-Z': 文字変換", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    { front: "tail -f / head -n 20", back: "tail -f: ファイル末尾をリアルタイム追跡（ログ監視）。head -n 20: 先頭20行を表示", categoryId: cat("LPIC-1", "[101] GNUとUnixコマンド") },
    // ── [101] デバイス・Linuxファイルシステム・FHS ──
    { front: "FHS の主要ディレクトリ", back: "/etc: 設定ファイル。/var: 可変データ（ログ等）。/usr: ユーザー向けプログラム。/home: ユーザーホーム。/tmp: 一時ファイル", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "mount / umount", back: "mount /dev/sdb1 /mnt: デバイスをマウント。umount /mnt: アンマウント。/etc/fstab で永続的なマウント設定", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "df -h / du -sh", back: "df -h: ファイルシステムの使用状況。du -sh dir/: ディレクトリの合計サイズを人間が読みやすい形式で表示", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "fsck /dev/sdb1", back: "ファイルシステムの整合性チェックと修復。アンマウント状態で実行する必要がある", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "mkfs.ext4 / mkfs.xfs", back: "ext4/xfsファイルシステムを作成する。パーティション作成後に使用", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "lsblk / blkid", back: "lsblk: ブロックデバイス一覧をツリー表示。blkid: デバイスのUUIDとファイルシステムタイプを表示", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "chmod / chown / umask", back: "chmod 755: パーミッション設定。chown user:group: 所有者変更。umask 022: 新規ファイルのデフォルトパーミッション制限", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    { front: "SUID / SGID / スティッキービット", back: "SUID(chmod u+s): 実行時に所有者権限。SGID(g+s): グループ継承。スティッキービット(+t): /tmp のように自分のファイルのみ削除可", categoryId: cat("LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS") },
    // ── [102] シェルとシェルスクリプト ──
    { front: "#!/bin/bash （shebang）", back: "スクリプトの実行インタプリタを指定する行。必ず1行目に記述する", categoryId: cat("LPIC-1", "[102] シェルとシェルスクリプト") },
    { front: "$0 / $1 / $# / $@ / $?", back: "$0:スクリプト名 $1〜:引数 $#:引数個数 $@:全引数 $?:直前の終了ステータス（0=成功）", categoryId: cat("LPIC-1", "[102] シェルとシェルスクリプト") },
    { front: "if [ -f file ]; then ... fi", back: "条件分岐。-f:通常ファイル -d:ディレクトリ -e:存在 -z:空文字列 -n:非空文字列", categoryId: cat("LPIC-1", "[102] シェルとシェルスクリプト") },
    { front: "for i in $(seq 1 5); do ... done", back: "ループ。seq 1 5 は 1〜5 を生成。for f in *.txt で glob展開も可能", categoryId: cat("LPIC-1", "[102] シェルとシェルスクリプト") },
    { front: "while read line; do ... done < file", back: "ファイルを1行ずつ読み込む。パイプで渡すことも可能（cat file | while read line）", categoryId: cat("LPIC-1", "[102] シェルとシェルスクリプト") },
    { front: "source / . (ドット)", back: "スクリプトを現在のシェルで実行する（サブシェルを作らない）。環境変数の設定に使用", categoryId: cat("LPIC-1", "[102] シェルとシェルスクリプト") },
    // ── [102] ユーザーインターフェースとデスクトップ ──
    { front: "X Window System", back: "Linuxのグラフィカルディスプレイシステム。X サーバーとX クライアントがプロトコルで通信する", categoryId: cat("LPIC-1", "[102] ユーザーインターフェースとデスクトップ") },
    { front: "DISPLAY 環境変数", back: "X クライアントが接続するディスプレイを指定。DISPLAY=:0 はローカルの最初のディスプレイ", categoryId: cat("LPIC-1", "[102] ユーザーインターフェースとデスクトップ") },
    // ── [102] 管理タスク ──
    { front: "useradd / usermod / userdel", back: "useradd -m user: ホームディレクトリ付きで追加。usermod -aG group user: グループ追加。userdel -r: ホームごと削除", categoryId: cat("LPIC-1", "[102] 管理タスク") },
    { front: "passwd / su / sudo", back: "passwd: パスワード変更。su - user: ユーザー切り替え。sudo cmd: root権限で実行（/etc/sudoers で設定）", categoryId: cat("LPIC-1", "[102] 管理タスク") },
    { front: "crontab -e / cron 書式", back: "crontab -e: 現在ユーザーのcron編集。書式: 分 時 日 月 曜日 コマンド。* は全て。*/5 は5分ごと", categoryId: cat("LPIC-1", "[102] 管理タスク") },
    { front: "at コマンド", back: "1回限りのジョブをスケジュールする。at 14:30 でジョブを登録し Ctrl+D で確定。atq で一覧", categoryId: cat("LPIC-1", "[102] 管理タスク") },
    { front: "localtime / timedatectl", back: "/etc/localtime でタイムゾーン設定。timedatectl でタイムゾーン・時刻の確認と設定", categoryId: cat("LPIC-1", "[102] 管理タスク") },
    // ── [102] 必須システムサービス ──
    { front: "syslog / rsyslog", back: "システムログデーモン。/etc/rsyslog.conf で設定。ファシリティ（kern, auth等）とセベリティ（info, warn, err等）で制御", categoryId: cat("LPIC-1", "[102] 必須システムサービス") },
    { front: "journalctl", back: "systemd のジャーナルログを表示。-u sshd: サービス指定。-f: リアルタイム。--since '1 hour ago': 時間指定", categoryId: cat("LPIC-1", "[102] 必須システムサービス") },
    { front: "ntpd / chrony / timedatectl", back: "NTPによる時刻同期。chrony は ntpd の後継。timedatectl set-ntp true でNTP同期を有効化", categoryId: cat("LPIC-1", "[102] 必須システムサービス") },
    // ── [102] ネットワークの基礎 ──
    { front: "ip addr show / ip route show", back: "ip addr: インターフェースとIPアドレス表示（ifconfigの後継）。ip route: ルーティングテーブル表示（route -n の後継）", categoryId: cat("LPIC-1", "[102] ネットワークの基礎") },
    { front: "ss -tuln / ping -c 4", back: "ss -tuln: リスニングポート表示（netstatの後継）。ping -c 4: 4回疎通確認", categoryId: cat("LPIC-1", "[102] ネットワークの基礎") },
    { front: "traceroute / dig / nslookup", back: "traceroute: 経路確認。dig domain: DNSクエリ。nslookup: 名前解決確認", categoryId: cat("LPIC-1", "[102] ネットワークの基礎") },
    { front: "/etc/resolv.conf / /etc/hosts", back: "resolv.conf: DNSサーバー設定（nameserver 行）。hosts: 静的ホスト名マッピング（DNSより先に参照）", categoryId: cat("LPIC-1", "[102] ネットワークの基礎") },
    { front: "ポート番号 基本", back: "SSH:22 HTTP:80 HTTPS:443 FTP:21 SMTP:25 DNS:53 NTP:123。/etc/services に一覧あり", categoryId: cat("LPIC-1", "[102] ネットワークの基礎") },
    // ── [102] セキュリティ ──
    { front: "ssh / ssh-keygen", back: "ssh user@host: リモートログイン。ssh-keygen -t rsa: RSA鍵ペア生成。公開鍵を ~/.ssh/authorized_keys に登録", categoryId: cat("LPIC-1", "[102] セキュリティ") },
    { front: "gpg コマンド", back: "GPG暗号化ツール。gpg --gen-key: 鍵生成。gpg -e -r user file: 暗号化。gpg -d file.gpg: 復号", categoryId: cat("LPIC-1", "[102] セキュリティ") },
    { front: "/etc/sudoers / visudo", back: "sudoの権限設定ファイル。必ず visudo で編集する（構文チェックあり）。user ALL=(ALL) ALL: 全コマンドを許可", categoryId: cat("LPIC-1", "[102] セキュリティ") },
  ];

  await prisma.flashcard.createMany({ data: flashcards, skipDuplicates: true });
  console.log(`✓ LPIC-1 フラッシュカード ${flashcards.length} 枚 を追加しました`);

  // ─── LPIC-1 クイズ問題 ───────────────────────────────────────
  const q = (
    body: string,
    choices: string[],
    correct: number[],
    explanation: string,
    certName: string,
    catName: string,
  ) => ({
    body,
    choices: JSON.stringify(choices.map((text, i) => ({ index: i, text }))),
    correctAnswers: JSON.stringify(correct),
    isMultiple: correct.length > 1,
    explanation,
    categoryId: cat(certName, catName),
    tags: certName,
  });

  const questions = [
    // [101] システムアーキテクチャ
    q("Linux の起動プロセスの順序として正しいものはどれか。",
      ["BIOS → GRUB → カーネル → init/systemd", "BIOS → カーネル → GRUB → init", "GRUB → BIOS → カーネル → init", "init → BIOS → GRUB → カーネル"],
      [0], "BIOS/UEFI がブートローダー（GRUB）を起動し、GRUBがカーネルをロード、その後 init または systemd がプロセス1として起動します。", "LPIC-1", "[101] システムアーキテクチャ"),
    q("systemd において runlevel 3 に相当するターゲットはどれか。",
      ["graphical.target", "multi-user.target", "rescue.target", "emergency.target"],
      [1], "multi-user.target が SysV の runlevel 3（マルチユーザー、テキストモード）に相当します。graphical.target は runlevel 5 です。", "LPIC-1", "[101] システムアーキテクチャ"),
    q("/proc ディレクトリに関する説明として正しいものはどれか。",
      ["実際のディスク上のファイルが格納されている", "カーネルとプロセス情報を提供する仮想ファイルシステム", "デバイスファイルが格納されている", "ユーザーの一時ファイルが保存される"],
      [1], "/proc は procfs（仮想ファイルシステム）で、カーネルの状態やプロセス情報をファイルとして提供します。実際のディスク容量は消費しません。", "LPIC-1", "[101] システムアーキテクチャ"),
    q("カーネルの起動メッセージを確認するコマンドはどれか。",
      ["syslog", "dmesg", "journalctl", "dmesg と journalctl -k の両方正しい"],
      [3], "dmesg はカーネルリングバッファを表示します。journalctl -k（または --dmesg）も同様にカーネルメッセージを表示します。", "LPIC-1", "[101] システムアーキテクチャ"),
    // [101] パッケージ管理
    q("Debian系でパッケージの設定ファイルも含めて完全削除するコマンドはどれか。",
      ["apt-get remove pkg", "apt-get purge pkg", "dpkg -r pkg", "apt-get delete pkg"],
      [1], "apt-get purge（または apt-get remove --purge）は設定ファイルも含めて削除します。remove は設定ファイルを残します。", "LPIC-1", "[101] Linuxのインストールとパッケージ管理"),
    q("RPMパッケージのインストールに使用するコマンドはどれか。",
      ["dpkg -i pkg.rpm", "apt-get install pkg.rpm", "rpm -ivh pkg.rpm", "yum add pkg.rpm"],
      [2], "rpm -ivh（install verbose hash）でRPMパッケージをインストールします。yum/dnf は依存関係を自動解決しますが、rpm コマンドは直接インストールです。", "LPIC-1", "[101] Linuxのインストールとパッケージ管理"),
    // [101] GNUコマンド
    q("`grep -v 'error' logfile` の動作として正しいものはどれか。",
      ["'error' を含む行を表示する", "'error' を含まない行を表示する", "'error' を削除してファイルを保存する", "'error' を含む行数を表示する"],
      [1], "-v オプションは逆マッチ（invert-match）で、パターンに一致しない行を表示します。", "LPIC-1", "[101] GNUとUnixコマンド"),
    q("`sed 's/foo/bar/g'` の動作として正しいものはどれか。",
      ["各行の最初の 'foo' のみを 'bar' に置換する", "全ての 'foo' を 'bar' に置換する", "'foo' の行を削除する", "'foo' を含む行のみ表示する"],
      [1], "g フラグ（global）により各行の全てのマッチを置換します。g なしは各行の最初のマッチのみです。", "LPIC-1", "[101] GNUとUnixコマンド"),
    q("プロセスの優先度（nice値）に関する説明として正しいものはどれか。",
      ["nice値が高いほどCPU優先度が高い", "nice値の範囲は 0 から 100 である", "nice値が低い（負の値）ほどCPU優先度が高い", "一般ユーザーはnice値を負の値に設定できる"],
      [2], "nice値は -20（最高優先度）〜 19（最低優先度）です。負の値（優先度を上げる）はrootのみ設定可能です。", "LPIC-1", "[101] GNUとUnixコマンド"),
    q("バックグラウンドジョブをフォアグラウンドに移動するコマンドはどれか。",
      ["bg %1", "jobs", "fg %1", "run %1"],
      [2], "fg（foreground）コマンドでジョブをフォアグラウンドに移動します。bg はバックグラウンドで再開、jobs はジョブ一覧です。", "LPIC-1", "[101] GNUとUnixコマンド"),
    // [101] デバイス・FHS
    q("FHS において /var ディレクトリに格納されるものはどれか。",
      ["ユーザーのホームディレクトリ", "システム設定ファイル", "ログファイルや可変データ", "一時ファイル"],
      [2], "/var はログ（/var/log）・スプール・キャッシュなど可変データを格納します。設定は /etc、一時ファイルは /tmp です。", "LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS"),
    q("ファイルシステムの整合性チェックに使用するコマンドはどれか。",
      ["mkfs", "fdisk", "fsck", "mount"],
      [2], "fsck（file system check）でファイルシステムの整合性チェックと修復を行います。アンマウント状態で実行する必要があります。", "LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS"),
    q("`chmod 644 file` で設定されるパーミッションはどれか。",
      ["rwxr-xr-x", "rw-rw-rw-", "rw-r--r--", "r--r--r--"],
      [2], "6=rw-、4=r--、4=r-- です。所有者は読み書き可、グループ・その他は読み取り専用。一般的なテキストファイルのパーミッションです。", "LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS"),
    q("SUID ビットの効果として正しいものはどれか。",
      ["グループの継承", "実行時にファイル所有者の権限で動作する", "自分のファイルのみ削除できる", "ディレクトリへの書き込みを禁止する"],
      [1], "SUID（Set User ID）が設定されたファイルは、実行時にファイル所有者の権限で動作します。/usr/bin/passwd などに設定されています。", "LPIC-1", "[101] デバイス・Linuxファイルシステム・FHS"),
    // [102] シェルとシェルスクリプト
    q("シェルスクリプトで直前のコマンドの終了ステータスを保持する変数はどれか。",
      ["$0", "$#", "$@", "$?"],
      [3], "$? は直前のコマンドの終了ステータスを保持します。0 は成功、1以上は失敗を示します。", "LPIC-1", "[102] シェルとシェルスクリプト"),
    q("スクリプトを現在のシェル環境で実行するコマンドはどれか。",
      ["bash script.sh", "./script.sh", "source script.sh", "exec script.sh"],
      [2], "source（またはドット . コマンド）は現在のシェルでスクリプトを実行するため、スクリプト内の変数や関数が現在のシェルに反映されます。", "LPIC-1", "[102] シェルとシェルスクリプト"),
    q("シェルスクリプトの条件式 `[ -d /tmp ]` が真になる条件はどれか。",
      ["/tmp が存在する", "/tmp が通常ファイルである", "/tmp がディレクトリである", "/tmp が空ディレクトリである"],
      [2], "-d はディレクトリが存在するか確認します。-f は通常ファイル、-e は存在チェック（種類問わず）です。", "LPIC-1", "[102] シェルとシェルスクリプト"),
    // [102] 管理タスク
    q("crontab の書式 `30 2 * * 1 /backup.sh` の意味として正しいものはどれか。",
      ["毎時30分に実行", "毎日2時30分に実行", "毎週月曜日の2時30分に実行", "毎月1日の2時30分に実行"],
      [2], "書式は「分 時 日 月 曜日」です。曜日の 1 は月曜日です。* はワイルドカードで「全て」を意味します。", "LPIC-1", "[102] 管理タスク"),
    q("ユーザーをグループに追加するコマンドはどれか。",
      ["useradd -G group user", "usermod -aG group user", "groupadd user group", "addgroup user group"],
      [1], "usermod -aG（append Group）で既存グループにユーザーを追加します。-a がないと他のグループから外れます。", "LPIC-1", "[102] 管理タスク"),
    // [102] ネットワーク
    q("DNS サーバーの設定ファイルはどれか。",
      ["/etc/hosts", "/etc/hostname", "/etc/resolv.conf", "/etc/network/dns"],
      [2], "/etc/resolv.conf に nameserver 行でDNSサーバーのIPアドレスを設定します。/etc/hosts は静的ホスト名マッピングです。", "LPIC-1", "[102] ネットワークの基礎"),
    q("リスニング中のTCP/UDPポートを表示するコマンドはどれか。",
      ["ip addr show", "ss -tuln", "traceroute", "dig localhost"],
      [1], "ss -tuln（または netstat -tuln）でリスニング中のポートを表示します。-t:TCP -u:UDP -l:LISTEN -n:数値表示", "LPIC-1", "[102] ネットワークの基礎"),
    // [102] セキュリティ
    q("SSH の公開鍵認証で、接続先に登録するファイルはどれか。",
      ["~/.ssh/id_rsa", "~/.ssh/known_hosts", "~/.ssh/authorized_keys", "~/.ssh/config"],
      [2], "公開鍵（id_rsa.pub）を接続先の ~/.ssh/authorized_keys に登録することで、パスワードなしのログインが可能になります。", "LPIC-1", "[102] セキュリティ"),
    q("/etc/sudoers ファイルを編集する際に使うべきコマンドはどれか。",
      ["vi /etc/sudoers", "nano /etc/sudoers", "visudo", "sudoedit /etc/sudoers"],
      [2], "visudo は構文チェック付きで /etc/sudoers を安全に編集します。直接編集すると構文エラー時に sudo が使えなくなる危険があります。", "LPIC-1", "[102] セキュリティ"),
  ];

  await prisma.question.createMany({ data: questions, skipDuplicates: true });
  console.log(`✓ LPIC-1 クイズ問題 ${questions.length} 問 を追加しました`);
  console.log("\n=== 完了 ===");
  console.log("LPIC-1: 101/102 の構成で再構成されました");
  console.log("LPIC-2: 201/202 のカテゴリが作成されました（問題は別途追加してください）");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
