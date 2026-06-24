import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const lpic1 = await prisma.certification.findUnique({ where: { name: "LPIC-1" } });
  if (!lpic1) throw new Error("LPIC-1 が見つかりません。先に npm run db:seed を実行してください。");

  const cats = await prisma.category.findMany({ where: { certificationId: lpic1.id } });
  const cat = (name: string) => {
    const c = cats.find((c) => c.name === name);
    if (!c) throw new Error(`カテゴリ "${name}" が見つかりません`);
    return c.id;
  };

  // ─── フラッシュカード ───────────────────────────────────────────
  const flashcards = [
    // ファイル操作
    { front: "ls -la", back: "隠しファイルを含む全ファイルの詳細一覧（パーミッション・所有者・サイズ・更新日時）を表示する", categoryId: cat("ファイル操作") },
    { front: "cp -r src dst", back: "ディレクトリを再帰的にコピーする。-p で属性（タイムスタンプ等）を保持", categoryId: cat("ファイル操作") },
    { front: "mv old new", back: "ファイルやディレクトリを移動、または名前変更する", categoryId: cat("ファイル操作") },
    { front: "rm -rf path", back: "ファイルやディレクトリを確認なしで強制的に再帰削除する。操作ミスに要注意", categoryId: cat("ファイル操作") },
    { front: "find / -name '*.log'", back: "ルートから .log 拡張子のファイルを再帰検索する。-mtime +7 で7日以上前のファイルを絞り込める", categoryId: cat("ファイル操作") },
    { front: "find . -type f -mtime +7", back: "カレントディレクトリ以下で7日以上前に更新された通常ファイルを検索する", categoryId: cat("ファイル操作") },
    { front: "ln -s target linkname", back: "シンボリックリンクを作成する。-s なしはハードリンク", categoryId: cat("ファイル操作") },
    { front: "touch file", back: "ファイルが存在しない場合は空ファイルを作成。存在する場合はタイムスタンプを現在時刻に更新", categoryId: cat("ファイル操作") },
    { front: "file filename", back: "ファイルの種類（テキスト・バイナリ・スクリプト等）を判定して表示する", categoryId: cat("ファイル操作") },
    { front: "du -sh dir/", back: "ディレクトリの合計ディスク使用量を人間が読みやすい形式（K/M/G）で表示", categoryId: cat("ファイル操作") },
    { front: "df -h", back: "マウント済みファイルシステムの容量・使用量・空き容量を人間が読みやすい形式で表示", categoryId: cat("ファイル操作") },
    { front: "stat file", back: "ファイルの詳細情報（inode番号・パーミッション・リンク数・タイムスタンプ）を表示", categoryId: cat("ファイル操作") },
    // プロセス管理
    { front: "ps aux", back: "全ユーザーの全プロセスをBSD形式で表示。a=全ユーザー u=ユーザー情報 x=端末なし含む", categoryId: cat("プロセス管理") },
    { front: "top", back: "CPU・メモリ使用率をリアルタイム更新で表示。q で終了、k でプロセス終了、r でrenice", categoryId: cat("プロセス管理") },
    { front: "kill -9 PID", back: "プロセスに SIGKILL(9) を送り強制終了する。-15 は SIGTERM（終了要求）、-1 は SIGHUP", categoryId: cat("プロセス管理") },
    { front: "killall プロセス名", back: "指定した名前と一致する全プロセスを終了させる", categoryId: cat("プロセス管理") },
    { front: "jobs", back: "現在のシェルで実行中・停止中のバックグラウンドジョブ一覧を表示", categoryId: cat("プロセス管理") },
    { front: "bg %1", back: "停止中のジョブ番号1をバックグラウンドで再開する", categoryId: cat("プロセス管理") },
    { front: "fg %1", back: "バックグラウンドジョブ番号1をフォアグラウンドに移動する", categoryId: cat("プロセス管理") },
    { front: "nice -n 10 command", back: "優先度を下げてコマンドを実行する。nice値は -20（最高優先）〜 19（最低優先）、デフォルトは0", categoryId: cat("プロセス管理") },
    { front: "renice -n 5 -p PID", back: "実行中のプロセスのnice値を変更する", categoryId: cat("プロセス管理") },
    { front: "nohup command &", back: "ログアウト後（HUPシグナル）も継続してバックグラウンド実行する。出力は nohup.out へ", categoryId: cat("プロセス管理") },
    // テキスト処理
    { front: "grep -r 'pattern' /dir", back: "ディレクトリを再帰的に検索してパターンに一致する行を表示。-i で大文字小文字無視", categoryId: cat("テキスト処理") },
    { front: "grep -v 'pattern'", back: "パターンに一致しない行を表示する（逆マッチ）", categoryId: cat("テキスト処理") },
    { front: "grep -c 'pattern'", back: "パターンに一致する行数を表示する", categoryId: cat("テキスト処理") },
    { front: "sed 's/old/new/g'", back: "各行の全ての 'old' を 'new' に置換する。g なしは各行の最初のみ。-i でファイル直接編集", categoryId: cat("テキスト処理") },
    { front: "awk '{print $2}'", back: "各行の第2フィールド（空白区切り）を出力する。-F: でフィールド区切りを変更", categoryId: cat("テキスト処理") },
    { front: "sort -n file", back: "数値順にソートする。-r で逆順、-k2 で第2フィールドでソート", categoryId: cat("テキスト処理") },
    { front: "uniq -c", back: "重複行を1行にまとめ、先頭に出現回数を付ける。sort と組み合わせて使う", categoryId: cat("テキスト処理") },
    { front: "wc -l file", back: "ファイルの行数を表示。-w で単語数、-c でバイト数", categoryId: cat("テキスト処理") },
    { front: "cut -d: -f1 /etc/passwd", back: "コロン区切りで第1フィールド（ユーザー名）を切り出す", categoryId: cat("テキスト処理") },
    { front: "tr 'a-z' 'A-Z'", back: "標準入力の小文字を大文字に変換して出力する", categoryId: cat("テキスト処理") },
    { front: "tail -f /var/log/syslog", back: "ファイルの末尾をリアルタイムで追跡表示する（ログ監視に必須）", categoryId: cat("テキスト処理") },
    // パーミッション
    { front: "chmod 755 file", back: "所有者: rwx(7)、グループ: r-x(5)、その他: r-x(5) に設定する", categoryId: cat("パーミッション") },
    { front: "chmod 644 file", back: "所有者: rw-(6)、グループ: r--(4)、その他: r--(4) に設定する（一般的なファイルのデフォルト）", categoryId: cat("パーミッション") },
    { front: "chmod +x file", back: "全ユーザーに実行権限を付与する（u+x, g+x, o+x）", categoryId: cat("パーミッション") },
    { front: "chown user:group file", back: "ファイルの所有者とグループを変更する。-R で再帰的に変更", categoryId: cat("パーミッション") },
    { front: "umask 022", back: "新規ファイル作成時のデフォルトパーミッションを制限する。ファイルは 644、ディレクトリは 755 になる", categoryId: cat("パーミッション") },
    { front: "chmod u+s file (SUID)", back: "実行時にファイル所有者の権限で動作する。/usr/bin/passwd などに設定されている", categoryId: cat("パーミッション") },
    { front: "chmod g+s dir (SGID)", back: "ディレクトリに設定すると、配下のファイルがディレクトリのグループを継承する", categoryId: cat("パーミッション") },
    { front: "chmod +t dir (スティッキービット)", back: "ディレクトリに設定すると、自分が所有するファイルのみ削除できる。/tmp に設定されている", categoryId: cat("パーミッション") },
    // パッケージ管理
    { front: "apt-get update", back: "リポジトリからパッケージリストを更新する（実際のアップグレードは行わない）", categoryId: cat("パッケージ管理") },
    { front: "apt-get install pkg", back: "パッケージをインストールする（Debian/Ubuntu系）", categoryId: cat("パッケージ管理") },
    { front: "apt-get remove pkg", back: "パッケージを削除する（設定ファイルは残る）。purge で設定ファイルも削除", categoryId: cat("パッケージ管理") },
    { front: "dpkg -l", back: "インストール済みパッケージの一覧を表示する（Debian系）", categoryId: cat("パッケージ管理") },
    { front: "dpkg -i package.deb", back: ".deb ファイルを直接インストールする", categoryId: cat("パッケージ管理") },
    { front: "rpm -ivh package.rpm", back: "RPMパッケージをインストールする。i=インストール v=詳細表示 h=進行状況表示", categoryId: cat("パッケージ管理") },
    { front: "rpm -qa", back: "インストール済み全RPMパッケージを一覧表示する", categoryId: cat("パッケージ管理") },
    { front: "rpm -e pkg", back: "RPMパッケージをアンインストールする", categoryId: cat("パッケージ管理") },
    { front: "yum install pkg", back: "パッケージをインストールする（Red Hat/CentOS系）。依存関係を自動解決", categoryId: cat("パッケージ管理") },
    // シェルスクリプト
    { front: "#!/bin/bash", back: "shebang（シバン）行。スクリプトの実行インタプリタを指定する。必ず1行目に記述", categoryId: cat("シェルスクリプト") },
    { front: "$0", back: "スクリプト自身のファイル名（パス含む）", categoryId: cat("シェルスクリプト") },
    { front: "$1, $2, ...", back: "コマンドライン引数（第1引数、第2引数...）。$9 以降は ${10} のように波括弧が必要", categoryId: cat("シェルスクリプト") },
    { front: "$#", back: "渡された引数の個数", categoryId: cat("シェルスクリプト") },
    { front: "$@", back: "全引数をそれぞれ個別の文字列として展開する（\"$1\" \"$2\" ...）", categoryId: cat("シェルスクリプト") },
    { front: "$?", back: "直前のコマンドの終了ステータス。0=成功、0以外=失敗", categoryId: cat("シェルスクリプト") },
    { front: "if [ -f file ]; then", back: "ファイルが存在し通常ファイルであれば真。-d=ディレクトリ -e=存在する -r=読み取り可 -z=空文字列", categoryId: cat("シェルスクリプト") },
    { front: "for i in $(seq 1 5); do", back: "1から5まで繰り返す。seq 1 2 10 なら 1,3,5,7,9 と2刻みで繰り返す", categoryId: cat("シェルスクリプト") },
    // ネットワーク設定
    { front: "ip addr show", back: "ネットワークインターフェースとIPアドレスを表示する（ifconfig の後継）", categoryId: cat("ネットワーク設定") },
    { front: "ip route show", back: "ルーティングテーブルを表示する（route -n の後継）", categoryId: cat("ネットワーク設定") },
    { front: "ping -c 4 host", back: "指定ホストに4回 ICMP パケットを送り疎通確認する", categoryId: cat("ネットワーク設定") },
    { front: "ss -tuln", back: "リスニング中のTCP/UDPポートを表示する（netstat -tuln の後継）。-t=TCP -u=UDP -l=リスニング -n=数値表示", categoryId: cat("ネットワーク設定") },
    { front: "traceroute host", back: "目的ホストまでの経路（ホップ）とレイテンシを表示する", categoryId: cat("ネットワーク設定") },
    { front: "dig example.com", back: "DNS クエリを実行してAレコード等を確認する。+short で簡潔表示", categoryId: cat("ネットワーク設定") },
    { front: "/etc/resolv.conf", back: "DNS サーバーのアドレスを設定するファイル。nameserver 行にDNSサーバーのIPを記述", categoryId: cat("ネットワーク設定") },
    { front: "/etc/hosts", back: "ホスト名とIPアドレスの静的マッピングファイル。DNS より先に参照される", categoryId: cat("ネットワーク設定") },
  ];

  await prisma.flashcard.createMany({ data: flashcards, skipDuplicates: true });
  console.log(`✓ フラッシュカード ${flashcards.length} 枚 を追加しました`);

  // ─── クイズ問題 ────────────────────────────────────────────────
  const q = (
    body: string,
    choices: string[],
    correct: number[],
    explanation: string,
    categoryName: string,
  ) => ({
    body,
    choices: JSON.stringify(choices.map((text, i) => ({ index: i, text }))),
    correctAnswers: JSON.stringify(correct),
    isMultiple: correct.length > 1,
    explanation,
    categoryId: cat(categoryName),
    tags: "LPIC-1",
  });

  const questions = [
    // ファイル操作
    q(
      "`ls -la` コマンドで表示される情報として正しいものはどれか。",
      ["ファイルのMD5ハッシュ値", "ルートディレクトリの一覧", "隠しファイルを含む全ファイルの詳細情報", "ディスク使用量の合計"],
      [2],
      "ls -l は詳細表示、-a は隠しファイル（.から始まるファイル）も含めて表示します。",
      "ファイル操作",
    ),
    q(
      "シンボリックリンクを作成するコマンドはどれか。",
      ["ln target link", "ln -s target link", "cp -l target link", "link -s target link"],
      [1],
      "ln -s でシンボリックリンクを作成します。-s なしはハードリンクです。",
      "ファイル操作",
    ),
    q(
      "`find` コマンドで7日以上前に更新されたファイルを検索するオプションはどれか。",
      ["-mtime +7", "-mtime -7", "-atime 7", "-newer 7"],
      [0],
      "-mtime +7 は「7日より前（7日超）」に変更されたファイルを検索します。-mtime -7 は「7日以内」です。",
      "ファイル操作",
    ),
    q(
      "ディレクトリを属性（タイムスタンプ・パーミッション）ごとコピーするコマンドはどれか。",
      ["cp -r src dst", "cp -rp src dst", "cp -a src dst", "cp -rp と cp -a の両方正しい"],
      [3],
      "cp -p は属性を保持、cp -r は再帰コピー。cp -a は -rp に加えシンボリックリンクも保持するため、どちらも属性を保ちながらコピーできます。",
      "ファイル操作",
    ),
    // プロセス管理
    q(
      "プロセスに SIGKILL シグナルを送るコマンドはどれか。",
      ["kill -1 PID", "kill -2 PID", "kill -15 PID", "kill -9 PID"],
      [3],
      "SIGKILL のシグナル番号は 9 です。-15 は SIGTERM（終了要求）、-1 は SIGHUP（設定再読み込み）です。",
      "プロセス管理",
    ),
    q(
      "`ps aux` コマンドの説明として正しいものはどれか。",
      ["現在のユーザーのプロセスのみ表示する", "全ユーザーの全プロセスをBSD形式で表示する", "プロセスをツリー形式で表示する", "CPUとメモリ使用率をリアルタイムで表示する"],
      [1],
      "a=全ユーザー、u=ユーザー情報付き、x=制御端末なしのプロセスも含む、です。リアルタイム表示は top コマンドです。",
      "プロセス管理",
    ),
    q(
      "バックグラウンドのジョブ番号1をフォアグラウンドに戻すコマンドはどれか。",
      ["bg %1", "jobs %1", "fg %1", "run %1"],
      [2],
      "fg（foreground）でジョブをフォアグラウンドに移動します。bg（background）は停止中のジョブをバックグラウンドで再開します。",
      "プロセス管理",
    ),
    q(
      "nice コマンドに関する説明として正しいものはどれか。",
      ["nice値が高いほどCPU優先度が高い", "nice値の範囲は 0 から 100 である", "nice値が低いほど（負の値）優先度が高い", "一般ユーザーはnice値を負の値に設定できる"],
      [2],
      "nice値は -20（最高優先）〜 19（最低優先）の範囲です。負の値（優先度を上げる）は root のみ設定できます。",
      "プロセス管理",
    ),
    // テキスト処理
    q(
      "`grep -v 'error' logfile` の説明として正しいものはどれか。",
      ["logfile から 'error' を含む行を表示する", "logfile から 'error' を含まない行を表示する", "logfile の 'error' を削除する", "logfile から 'error' を含む行数を表示する"],
      [1],
      "-v オプションはパターンに一致しない行を表示します（逆マッチ）。行数を数えるには -c を使います。",
      "テキスト処理",
    ),
    q(
      "ファイルの行数・単語数・バイト数を表示するコマンドはどれか。",
      ["count file", "wc file", "stat file", "awk '{count++} END{print count}' file"],
      [1],
      "wc（word count）コマンドで行数(-l)・単語数(-w)・バイト数(-c)を表示します。",
      "テキスト処理",
    ),
    q(
      "`sed 's/foo/bar/g'` の説明として正しいものはどれか。",
      ["各行の最初の 'foo' のみを 'bar' に置換する", "全ての 'foo' を 'bar' に置換する", "'foo' の行を削除する", "'foo' を含む行のみを表示する"],
      [1],
      "g フラグ（global）で各行の全ての一致を置換します。g なしは各行の最初の一致のみです。",
      "テキスト処理",
    ),
    q(
      "`sort | uniq -c | sort -rn` パイプラインの説明として正しいものはどれか。",
      ["ファイルをアルファベット順に並べる", "重複行を出現回数の多い順に表示する", "ファイルのバイト数を降順に表示する", "ファイルの行数を降順に表示する"],
      [1],
      "sort で並べ替え → uniq -c で出現回数をカウント → sort -rn で回数の多い順（数値降順）に並べます。",
      "テキスト処理",
    ),
    // パーミッション
    q(
      "`chmod 644 file` で設定されるパーミッションはどれか。",
      ["rwxr-xr-x", "rw-rw-rw-", "rw-r--r--", "r--r--r--"],
      [2],
      "6=rw-、4=r--、4=r-- です。一般的なテキストファイルのデフォルトパーミッションです。",
      "パーミッション",
    ),
    q(
      "SUID ビットに関する説明として正しいものはどれか。",
      ["ディレクトリ配下のファイルがグループを継承する", "実行時にファイル所有者の権限で動作する", "自分のファイルのみ削除できるようにする", "全ユーザーへの書き込みを許可する"],
      [1],
      "SUID（Set User ID）は実行時にプログラムの所有者権限で動作します。/usr/bin/passwd などに設定されています。",
      "パーミッション",
    ),
    q(
      "/tmp ディレクトリに設定されているスティッキービットの効果はどれか。",
      ["全ユーザーが読み取り専用になる", "rootのみが書き込めるようになる", "自分が所有するファイルのみ削除できる", "ディレクトリ自体が削除できなくなる"],
      [2],
      "スティッキービットが設定されたディレクトリでは、ファイルの所有者（またはroot）のみが自分のファイルを削除できます。",
      "パーミッション",
    ),
    q(
      "`umask 022` が設定されている場合、新規作成したファイルのパーミッションはどれか。",
      ["777", "755", "644", "022"],
      [2],
      "ファイルのデフォルト最大値 666 から umask 022 を引くと 644 になります。ディレクトリは 777 - 022 = 755 です。",
      "パーミッション",
    ),
    // パッケージ管理
    q(
      "Debian系でインストール済みパッケージ一覧を確認するコマンドはどれか。",
      ["rpm -qa", "yum list installed", "dpkg -l", "apt-cache show"],
      [2],
      "dpkg -l（list）でインストール済みパッケージを一覧表示します。rpm -qa は Red Hat 系のコマンドです。",
      "パッケージ管理",
    ),
    q(
      "RPMパッケージのインストールコマンドとして正しいものはどれか。",
      ["dpkg -i pkg.rpm", "apt-get install pkg.rpm", "rpm -ivh pkg.rpm", "yum localinstall pkg.rpm と rpm -ivh pkg.rpm の両方正しい"],
      [3],
      "rpm -ivh（install verbose hash）でインストールできます。yum localinstall でも依存関係を解決しながらローカルRPMをインストールできます。",
      "パッケージ管理",
    ),
    // ネットワーク設定
    q(
      "DNS サーバーの設定が記述されているファイルはどれか。",
      ["/etc/hosts", "/etc/hostname", "/etc/resolv.conf", "/etc/network/dns"],
      [2],
      "/etc/resolv.conf に nameserver 行でDNSサーバーのIPを記述します。/etc/hosts はホスト名の静的マッピングです。",
      "ネットワーク設定",
    ),
    q(
      "`ip addr show` コマンドの説明として正しいものはどれか。",
      ["ルーティングテーブルを表示する", "ネットワークインターフェースとIPアドレスを表示する", "DNS設定を表示する", "リスニングポートを表示する"],
      [1],
      "ip addr show はインターフェースのIPアドレス情報を表示します。ルーティングは ip route show です。",
      "ネットワーク設定",
    ),
    q(
      "リスニング中のTCPポートを数値で確認するコマンドはどれか。",
      ["ss -tuln", "ip link show", "traceroute localhost", "dig localhost"],
      [0],
      "ss -tuln でリスニング中のTCP/UDPポートを数値形式で表示します（netstat -tuln の後継）。",
      "ネットワーク設定",
    ),
    // シェルスクリプト
    q(
      "シェルスクリプトで直前のコマンドの終了ステータスを保持する変数はどれか。",
      ["$0", "$#", "$@", "$?"],
      [3],
      "$? は直前のコマンドの終了ステータスを保持します。0 は成功、0以外は失敗を示します。",
      "シェルスクリプト",
    ),
    q(
      "`#!/bin/bash` の行の役割はどれか。",
      ["コメント行でスクリプトの説明を記述する", "スクリプトの実行インタプリタを指定するshebang行", "bashのバージョンを指定する", "スクリプトに実行権限を付与する"],
      [1],
      "#!（シバン）に続けてインタプリタのパスを記述します。スクリプトの最初の行に置く必要があります。",
      "シェルスクリプト",
    ),
    q(
      "シェルスクリプトで渡された引数の個数を取得する変数はどれか。",
      ["$@", "$*", "$#", "$1"],
      [2],
      "$# は引数の個数を保持します。$@ は全引数を個別に、$* は全引数を一つの文字列として展開します。",
      "シェルスクリプト",
    ),
  ];

  await prisma.question.createMany({ data: questions, skipDuplicates: true });
  console.log(`✓ クイズ問題 ${questions.length} 問 を追加しました`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
