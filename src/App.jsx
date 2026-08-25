import { useState, useEffect, useRef } from 'react';
import { Code2, Braces, FileCode2, Atom, Database, CheckCircle2, Circle, Clock, X, ChevronDown, Sparkles, LayoutGrid, UserRound, Star, Copy, RotateCcw, Download, Upload, Lock, Pencil, Check, Menu } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* 共通ユーティリティ                                                    */
/* ------------------------------------------------------------------ */

const DIFF_LABEL = { 1: '初級', 2: '中級', 3: '上級', 4: '超上級', 5: '最難関' };
const DIFF_COLOR = { 1: '#7CD992', 2: '#B7DD6A', 3: '#FFD23F', 4: '#FF9A3F', 5: '#FF5C7A' };
// テーマ(レッスン)ごとの難易度による経験値の微調整倍率（★3=基準1.0）
const DIFF_XP_MULT = { 1: 0.8, 2: 0.9, 3: 1.0, 4: 1.15, 5: 1.4 };

function buildChapters(base, defs) {
  return defs.map((def) => ({
    title: def.title,
    lessons: def.lessons.map((l) => ({
      title: l.t,
      note: l.n,
      difficulty: l.d,
      xp: Math.round(base * DIFF_XP_MULT[l.d]),
    })),
  }));
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* noop */ }
  document.body.removeChild(ta);
}

/* ------------------------------------------------------------------ */
/* バックアップ(進捗の保存/読み込み)まわりのユーティリティ                     */
/* シンプルな手動方式：保存＝JSONファイルをダウンロード、読み込み＝ファイル選択 */
/* ------------------------------------------------------------------ */

function downloadJSON(data, filename) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* 自動保存(進捗・プロフィール)まわりのユーティリティ                       */
/* ブラウザのlocalStorageに保存する。プライベートブラウジング等で         */
/* localStorageが使えない場合は静かに失敗し、その旨をfinally側で扱う。   */
/* ------------------------------------------------------------------ */

function loadLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? { value: raw } : null;
  } catch (e) {
    return null;
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, value);
}

/* ------------------------------------------------------------------ */
/* データ定義                                                          */
/* ------------------------------------------------------------------ */

const COURSES = [
  {
    id: 'htmlcss',
    name: 'HTML/CSS',
    kana: 'マークアップ職人',
    icon: Code2,
    from: '#FF7A45',
    to: '#FFC145',
    timeXP: 10,
    difficulty: 1.0,
    titles: ['見習いマークアップ職人', '独学のCSS使い', '実務級マークアップエンジニア', '超エリート級デザインエンジニア', 'マークアップの創造神'],
    chapters: buildChapters(25, [
      { title: '第1章・HTML基礎', lessons: [
        { t: 'タグの基本', n: 'HTMLの基本タグ(<div>, <p>, <span>, <a>など)の役割と使い分けを具体例つきで教えて', d: 1 },
        { t: '見出しとテキスト', n: '見出しタグ(h1〜h6)や段落タグの正しい使い分けと、SEOやアクセシビリティ上の注意点を教えて', d: 1 },
        { t: 'リンクの設置', n: '<a>タグを使ったリンクの作り方(外部リンク・内部リンク・target属性)を実例つきで教えて', d: 1 },
        { t: '画像の挿入', n: '<img>タグの基本的な使い方と、alt属性やサイズ指定など画像挿入時の注意点を教えて', d: 1 },
        { t: 'セマンティックタグ', n: 'header, nav, main, footerなどのセマンティックタグの意味と、divとの使い分けを教えて', d: 2 },
      ]},
      { title: '第2章・HTMLの構造', lessons: [
        { t: 'リスト(ul/ol)', n: 'ulとolの違いと、リスト要素を使ったマークアップの実例を教えて', d: 1 },
        { t: 'テーブルの作成', n: 'table, tr, td, thを使った表の作り方と、colspan/rowspanの使い方を教えて', d: 2 },
        { t: 'フォームの基本', n: 'formタグとinput要素を使った基本的な入力フォームの作り方を教えて', d: 2 },
        { t: '入力要素の種類', n: 'text, checkbox, radio, selectなど様々なinputタイプの使い分けを実例つきで教えて', d: 2 },
        { t: 'フォームバリデーション', n: 'HTMLのrequiredやpatternなど標準バリデーション属性を使ったフォームの入力チェック方法を教えて', d: 3 },
      ]},
      { title: '第3章・CSS基礎', lessons: [
        { t: 'セレクタの使い方', n: '要素セレクタ・クラスセレクタ・IDセレクタなどCSSセレクタの種類と優先順位を教えて', d: 1 },
        { t: '文字と色の装飾', n: 'color, font-size, font-weightなど文字装飾に使う主要なCSSプロパティを教えて', d: 1 },
        { t: 'ボックスモデル', n: 'content, padding, border, marginから成るCSSボックスモデルの考え方を教えて', d: 2 },
        { t: 'margin/paddingの調整', n: 'margin/paddingの指定方法(個別指定・ショートハンド)とmarginの相殺現象について教えて', d: 2 },
        { t: '疑似クラス', n: ':hover, :focus, :nth-childなど代表的な疑似クラスの使い方を実例つきで教えて', d: 2 },
      ]},
      { title: '第4章・CSS装飾', lessons: [
        { t: '背景とグラデーション', n: 'background-color, background-image, linear-gradientを使った背景装飾の方法を教えて', d: 2 },
        { t: 'ボーダーと影', n: 'borderの指定方法とbox-shadowを使った影の付け方を実例つきで教えて', d: 2 },
        { t: 'トランジション', n: 'transitionプロパティを使って要素の変化を滑らかにアニメーションさせる方法を教えて', d: 3 },
        { t: 'トランスフォーム', n: 'transform(scale, rotate, translate)を使った要素の変形方法を教えて', d: 3 },
        { t: 'フォント管理', n: 'Webフォントの読み込み方法(@font-face, Google Fonts)とフォールバックの考え方を教えて', d: 2 },
      ]},
      { title: '第5章・レイアウト', lessons: [
        { t: 'Flexboxの基本', n: 'display:flexの基本的な使い方と、主軸・交差軸の考え方を教えて', d: 2 },
        { t: 'Flexboxで整列', n: 'justify-content, align-items, flex-wrapを使った要素の整列方法を実例つきで教えて', d: 3 },
        { t: 'CSS Gridの基本', n: 'display:gridとgrid-template-columnsを使った基本的なグリッドレイアウトの作り方を教えて', d: 3 },
        { t: 'Gridでレイアウト設計', n: 'grid-template-areasを使った複雑なレイアウト設計の方法を教えて', d: 4 },
        { t: 'position活用', n: 'static, relative, absolute, fixed, stickyの違いと実践的な使いどころを教えて', d: 3 },
      ]},
      { title: '第6章・レスポンシブ対応', lessons: [
        { t: 'メディアクエリの基本', n: '@media を使った画面幅ごとのスタイル切り替え方法を教えて', d: 2 },
        { t: 'モバイルファースト設計', n: 'モバイルファーストでCSSを設計する考え方とメリットを教えて', d: 3 },
        { t: 'ブレークポイント設計', n: '一般的なブレークポイントの目安と、プロジェクトに合わせた設計方法を教えて', d: 3 },
        { t: 'レスポンシブ画像', n: 'srcsetやpicture要素を使ったレスポンシブ画像の実装方法を教えて', d: 3 },
        { t: 'コンテナクエリ入門', n: 'コンテナクエリ(@container)の基本的な使い方と、メディアクエリとの違いを教えて', d: 4 },
      ]},
      { title: '第7章・モダンCSS', lessons: [
        { t: 'CSS変数', n: 'カスタムプロパティ(--変数名)を使ったCSS変数の定義と活用方法を教えて', d: 3 },
        { t: 'アニメーション基礎', n: '@keyframesを使ったCSSアニメーションの作り方を実例つきで教えて', d: 3 },
        { t: 'アクセシビリティ対応', n: 'CSSでできるアクセシビリティ対応(コントラスト比、フォーカス表示など)を教えて', d: 3 },
        { t: 'ダークモード対応', n: 'prefers-color-schemeを使ったダークモード対応の実装方法を教えて', d: 3 },
        { t: 'CSS設計手法(BEM)', n: 'BEM記法を使ったクラス命名規則と、保守しやすいCSS設計の考え方を教えて', d: 4 },
      ]},
      { title: '第8章・実践課題', lessons: [
        { t: 'プロフィールページ制作', n: '自己紹介用のシンプルなプロフィールページを、HTML/CSSだけで作る手順を教えて', d: 4 },
        { t: 'ランディングページ制作', n: '1ページ完結型のランディングページをHTML/CSSで作成する構成と手順を教えて', d: 4 },
        { t: 'ポートフォリオサイト制作', n: '作品を紹介するポートフォリオサイトをHTML/CSSで構築する手順を教えて', d: 5 },
        { t: 'レスポンシブ企業サイト制作', n: '複数セクションを持つレスポンシブ対応の企業サイトをHTML/CSSで構築する手順を教えて', d: 5 },
        { t: '総合演習サイト制作', n: 'これまで学んだHTML/CSSの知識を総動員して、オリジナルのWebサイトを1つ設計・実装する手順を教えて', d: 5 },
      ]},
    ]),
  },
  {
    id: 'js',
    name: 'JavaScript',
    kana: 'ロジックの使い手',
    icon: Braces,
    from: '#FFD23F',
    to: '#FF9A3F',
    timeXP: 12,
    difficulty: 1.3,
    titles: ['見習いスクリプター', '独学のJS使い', '実務級JSエンジニア', '超エリート級フロントエンド職人', 'ロジックの創造神'],
    chapters: buildChapters(32, [
      { title: '第1章・基礎文法', lessons: [
        { t: '変数と定数', n: 'let, const, varの違いと、変数・定数の適切な使い分けを教えて', d: 1 },
        { t: 'データ型', n: 'JavaScriptの基本データ型(数値, 文字列, 真偽値, null, undefinedなど)を教えて', d: 1 },
        { t: '演算子', n: '算術演算子・比較演算子・論理演算子の使い方と注意点を教えて', d: 1 },
        { t: '条件分岐', n: 'if文とswitch文を使った条件分岐の書き方を実例つきで教えて', d: 1 },
        { t: '繰り返し処理', n: 'for文とwhile文を使った繰り返し処理の書き方と使い分けを教えて', d: 2 },
      ]},
      { title: '第2章・関数とスコープ', lessons: [
        { t: '関数の定義', n: '関数宣言と関数式の違いと、それぞれの使いどころを教えて', d: 2 },
        { t: 'アロー関数', n: 'アロー関数の書き方と、通常の関数との違い(thisの扱いなど)を教えて', d: 2 },
        { t: 'スコープとクロージャ', n: 'スコープの概念とクロージャの仕組みを実例つきで教えて', d: 3 },
        { t: '高階関数', n: '関数を引数や戻り値として扱う高階関数の考え方を教えて', d: 3 },
        { t: 'コールバック関数', n: 'コールバック関数の基本的な使い方と、非同期処理での役割を教えて', d: 3 },
      ]},
      { title: '第3章・配列とオブジェクト', lessons: [
        { t: '配列の基本操作', n: 'push, pop, splice, sliceなど配列の基本操作メソッドを教えて', d: 2 },
        { t: 'map/filter/reduce', n: 'map, filter, reduceを使った配列操作の書き方と使いどころを実例つきで教えて', d: 3 },
        { t: 'オブジェクトの操作', n: 'オブジェクトのプロパティ追加・削除・参照方法を教えて', d: 2 },
        { t: '分割代入', n: '配列やオブジェクトの分割代入の書き方と便利な使い方を教えて', d: 3 },
        { t: 'スプレッド構文', n: 'スプレッド構文(...)を使った配列・オブジェクトのコピーや結合方法を教えて', d: 3 },
      ]},
      { title: '第4章・DOM操作とイベント', lessons: [
        { t: 'DOM要素の取得', n: 'querySelectorなどを使ってDOM要素を取得する方法を教えて', d: 2 },
        { t: 'DOM要素の操作', n: '取得したDOM要素のテキストやスタイルを書き換える方法を教えて', d: 2 },
        { t: 'イベントリスナー', n: 'addEventListenerを使ったイベント処理の基本を教えて', d: 3 },
        { t: 'フォーム操作', n: 'JavaScriptでフォームの入力値を取得・検証する方法を教えて', d: 3 },
        { t: 'イベント委譲', n: 'イベントバブリングを利用したイベント委譲の仕組みと実装方法を教えて', d: 4 },
      ]},
      { title: '第5章・非同期処理', lessons: [
        { t: 'Promiseの基本', n: 'Promiseの基本的な考え方とthen/catchを使った書き方を教えて', d: 3 },
        { t: 'async/await', n: 'async/awaitを使った非同期処理の書き方とPromiseとの関係を教えて', d: 3 },
        { t: 'fetch APIの利用', n: 'fetch APIを使ったHTTPリクエストの送信方法を実例つきで教えて', d: 3 },
        { t: 'エラーハンドリング', n: 'try/catchを使った非同期処理のエラーハンドリング方法を教えて', d: 4 },
        { t: 'タイムアウト処理', n: 'setTimeoutやPromise.raceを使ったタイムアウト処理の実装方法を教えて', d: 4 },
      ]},
      { title: '第6章・モジュールと設計', lessons: [
        { t: 'ES Modules', n: 'import/exportを使ったES Modulesの基本的な使い方を教えて', d: 3 },
        { t: 'クラス構文', n: 'classを使ったオブジェクト指向的な書き方の基本を教えて', d: 3 },
        { t: '継承とプロトタイプ', n: 'extendsを使ったクラスの継承と、JavaScriptのプロトタイプチェーンの仕組みを教えて', d: 4 },
        { t: '状態管理の基本', n: 'アプリケーションの状態を管理する基本的な考え方を教えて', d: 4 },
        { t: 'デザインパターン入門', n: 'JavaScriptでよく使われる代表的なデザインパターン(シングルトンなど)を教えて', d: 4 },
      ]},
      { title: '第7章・パフォーマンスとテスト', lessons: [
        { t: 'デバッグ手法', n: 'console.logやブラウザの開発者ツールを使ったデバッグの基本テクニックを教えて', d: 3 },
        { t: '単体テストの基本', n: 'JavaScriptにおける単体テストの考え方と簡単なテストの書き方を教えて', d: 4 },
        { t: 'パフォーマンス最適化', n: 'JavaScriptの実行速度を改善する基本的な最適化テクニックを教えて', d: 4 },
        { t: 'メモリ管理の基礎', n: 'ガベージコレクションの仕組みとメモリリークを防ぐための基本を教えて', d: 4 },
        { t: 'エラーバウンダリ設計', n: 'アプリ全体で発生しうるエラーを安全に処理するための設計の考え方を教えて', d: 5 },
      ]},
      { title: '第8章・実践課題', lessons: [
        { t: 'ToDoアプリ制作', n: 'JavaScriptだけでシンプルなToDoアプリを作る手順を教えて', d: 4 },
        { t: '簡易電卓アプリ制作', n: '四則演算ができる簡易電卓アプリをJavaScriptで作る手順を教えて', d: 4 },
        { t: 'APIを使ったアプリ制作', n: '外部APIからデータを取得して表示するアプリの作り方を教えて', d: 5 },
        { t: 'チャットUI制作', n: 'メッセージの送受信を模したチャットUIをJavaScriptで作る手順を教えて', d: 5 },
        { t: '総合演習アプリ制作', n: 'これまで学んだJavaScriptの知識を総動員して、オリジナルのアプリを1つ設計・実装する手順を教えて', d: 5 },
      ]},
    ]),
  },
  {
    id: 'ts',
    name: 'TypeScript',
    kana: '型の探求者',
    icon: FileCode2,
    from: '#4D8DFF',
    to: '#7AE3FF',
    timeXP: 15,
    difficulty: 1.6,
    titles: ['見習い型ハンター', '独学の型使い', '実務級型エンジニア', '超エリート級型アーキテクト', '型の創造神'],
    chapters: buildChapters(40, [
      { title: '第1章・型注釈の基礎', lessons: [
        { t: '基本の型', n: 'string, number, booleanなどTypeScriptの基本的な型注釈の書き方を教えて', d: 1 },
        { t: '配列とタプル', n: '配列型とタプル型の書き方と使い分けを教えて', d: 2 },
        { t: '関数の型', n: '関数の引数と戻り値に型注釈をつける方法を教えて', d: 2 },
        { t: 'リテラル型', n: '特定の値だけを許容するリテラル型の使い方を教えて', d: 2 },
        { t: 'any/unknown/never', n: 'any, unknown, neverそれぞれの型の意味と安全な使い分けを教えて', d: 3 },
      ]},
      { title: '第2章・インターフェースと型エイリアス', lessons: [
        { t: 'interfaceの基本', n: 'interfaceを使ったオブジェクトの型定義の基本を教えて', d: 2 },
        { t: 'type aliasの基本', n: 'typeを使った型エイリアスの定義方法とinterfaceとの違いを教えて', d: 2 },
        { t: '拡張と交差型', n: 'interfaceの拡張(extends)と交差型(&)の使い方を教えて', d: 3 },
        { t: 'オプショナルプロパティ', n: '?を使ったオプショナルプロパティの定義方法と使いどころを教えて', d: 2 },
        { t: 'readonlyプロパティ', n: 'readonlyを使って変更不可なプロパティを定義する方法とメリットを教えて', d: 3 },
      ]},
      { title: '第3章・ジェネリクス', lessons: [
        { t: 'ジェネリクスの基本', n: 'ジェネリクス<T>の基本的な考え方と使う理由を教えて', d: 3 },
        { t: 'ジェネリック関数', n: '型引数を持つジェネリック関数の書き方を実例つきで教えて', d: 3 },
        { t: 'ジェネリッククラス', n: 'ジェネリクスを使ったクラスの定義方法を教えて', d: 4 },
        { t: '制約付きジェネリクス', n: 'extendsを使ってジェネリクスに制約をつける方法を教えて', d: 4 },
        { t: 'デフォルト型引数', n: 'ジェネリクスにデフォルトの型引数を設定する方法を教えて', d: 3 },
      ]},
      { title: '第4章・クラスとOOP', lessons: [
        { t: 'クラスの基本', n: 'TypeScriptにおけるクラスの基本的な書き方を教えて', d: 2 },
        { t: '継承とポリモーフィズム', n: 'クラスの継承とポリモーフィズムの考え方をTypeScriptの例で教えて', d: 3 },
        { t: 'アクセス修飾子', n: 'public, private, protectedの違いと使い分けを教えて', d: 3 },
        { t: '抽象クラス', n: 'abstractキーワードを使った抽象クラスの定義方法と使いどころを教えて', d: 4 },
        { t: 'インターフェース実装', n: 'implementsを使ってクラスにinterfaceを実装する方法を教えて', d: 3 },
      ]},
      { title: '第5章・高度な型', lessons: [
        { t: 'Union/Intersection型', n: 'Union型(|)とIntersection型(&)の違いと使い方を教えて', d: 3 },
        { t: 'Utility Types', n: 'Partial, Pick, Omitなど代表的なUtility Typesの使い方を教えて', d: 4 },
        { t: '型ガード', n: 'typeofやinstanceofを使った型ガードの書き方を教えて', d: 4 },
        { t: '条件付き型', n: '条件付き型(Conditional Types)の基本的な考え方と使い方を教えて', d: 5 },
        { t: 'Mapped Types', n: 'Mapped Typesを使って既存の型から新しい型を生成する方法を教えて', d: 5 },
      ]},
      { title: '第6章・モジュールと設定', lessons: [
        { t: 'モジュールの分割', n: 'TypeScriptプロジェクトにおけるモジュール分割の基本的な考え方を教えて', d: 3 },
        { t: '型定義ファイル(.d.ts)', n: '.d.tsファイルの役割と、外部ライブラリの型定義の使い方を教えて', d: 4 },
        { t: 'tsconfig設定', n: 'tsconfig.jsonの主要な設定項目とその意味を教えて', d: 3 },
        { t: 'デコレーター入門', n: 'TypeScriptのデコレーターの基本的な考え方と使い方を教えて', d: 4 },
        { t: '名前空間', n: 'namespaceを使った名前空間の使い方と、モジュールとの違いを教えて', d: 3 },
      ]},
      { title: '第7章・実務スキル', lessons: [
        { t: '外部ライブラリの型定義利用', n: '@typesパッケージなど外部ライブラリの型定義を利用する方法を教えて', d: 4 },
        { t: '型安全なAPI設計', n: 'APIレスポンスを型安全に扱うための設計方法を教えて', d: 5 },
        { t: 'strictモード活用', n: 'strictモードを有効にすることで得られる型安全性のメリットを教えて', d: 4 },
        { t: 'エラーハンドリングの型設計', n: 'エラーの型を明確にした安全なエラーハンドリング設計の考え方を教えて', d: 5 },
        { t: '型テストの書き方', n: '型が意図通りであることを検証する型テストの書き方を教えて', d: 4 },
      ]},
      { title: '第8章・実践課題', lessons: [
        { t: '型安全なTodoアプリ', n: 'TypeScriptで型安全なTodoアプリを作る手順を教えて', d: 4 },
        { t: 'APIレスポンスの型定義', n: '外部APIのレスポンスに対して適切な型定義を行う方法を教えて', d: 5 },
        { t: 'フォームバリデーション設計', n: 'TypeScriptを使った型安全なフォームバリデーションの設計方法を教えて', d: 5 },
        { t: '型安全な状態管理', n: 'TypeScriptで型安全な状態管理を実装する方法を教えて', d: 5 },
        { t: '総合演習プロジェクト', n: 'これまで学んだTypeScriptの知識を総動員して、型安全な小さなプロジェクトを設計・実装する手順を教えて', d: 5 },
      ]},
    ]),
  },
  {
    id: 'react',
    name: 'React',
    kana: 'UI建築士',
    icon: Atom,
    from: '#B36BFF',
    to: '#61DBFB',
    timeXP: 18,
    difficulty: 2.0,
    titles: ['見習いコンポーネント職人', '独学のフック使い', '実務級UIエンジニア', '超エリート級フロントエンドアーキテクト', 'UIの創造神'],
    chapters: buildChapters(50, [
      { title: '第1章・React基礎', lessons: [
        { t: 'コンポーネントとJSX', n: 'Reactのコンポーネントの基本構造とJSXの書き方を教えて', d: 1 },
        { t: 'propsの受け渡し', n: '親コンポーネントから子コンポーネントへpropsを渡す方法を教えて', d: 1 },
        { t: 'イベントハンドリング', n: 'onClickなどReactにおけるイベントハンドリングの基本を教えて', d: 1 },
        { t: '条件付きレンダリング', n: '三項演算子や&&を使った条件付きレンダリングの書き方を教えて', d: 2 },
        { t: 'スタイリング手法', n: 'CSSモジュールやインラインスタイルなどReactにおけるスタイリングの選択肢を教えて', d: 2 },
      ]},
      { title: '第2章・state管理', lessons: [
        { t: 'useStateの基本', n: 'useStateフックを使った状態管理の基本を教えて', d: 2 },
        { t: 'フォームとstate', n: 'フォームの入力値をuseStateで管理する方法を教えて', d: 2 },
        { t: 'リストレンダリング', n: '配列データをmapで展開してリスト表示する方法を教えて', d: 2 },
        { t: 'key属性の重要性', n: 'リストレンダリングにおけるkey属性の役割と正しい設定方法を教えて', d: 3 },
        { t: '複雑なstate設計', n: 'オブジェクトや配列を含む複雑なstateを適切に更新する方法を教えて', d: 3 },
      ]},
      { title: '第3章・hooks基礎', lessons: [
        { t: 'useEffectの基本', n: 'useEffectフックの基本的な使い方とライフサイクルとの関係を教えて', d: 2 },
        { t: 'useEffectの依存配列', n: 'useEffectの依存配列の指定方法と、よくある落とし穴を教えて', d: 3 },
        { t: 'useRefの使い方', n: 'useRefを使ったDOM参照や値の保持方法を教えて', d: 3 },
        { t: 'useContextの基本', n: 'useContextを使ったコンポーネント間の状態共有方法を教えて', d: 3 },
        { t: 'useReducerの基本', n: 'useReducerを使った複雑な状態管理の書き方を教えて', d: 3 },
      ]},
      { title: '第4章・hooksの応用', lessons: [
        { t: 'カスタムフック作成', n: '独自のカスタムフックを作成してロジックを再利用する方法を教えて', d: 3 },
        { t: 'useMemo/useCallback', n: 'useMemoとuseCallbackを使ったパフォーマンス最適化の方法を教えて', d: 4 },
        { t: 'パフォーマンス最適化', n: 'Reactアプリの不要な再レンダリングを防ぐための最適化テクニックを教えて', d: 4 },
        { t: 'Suspenseの基本', n: 'Suspenseを使った非同期コンポーネントの読み込み方法を教えて', d: 4 },
        { t: 'エラーバウンダリ', n: 'Error Boundaryを使ったコンポーネントのエラー処理方法を教えて', d: 4 },
      ]},
      { title: '第5章・状態管理とルーティング', lessons: [
        { t: '状態管理の考え方', n: 'アプリ全体の状態をどこでどう管理すべきかの考え方を教えて', d: 3 },
        { t: 'React Routerの基本', n: 'React Routerを使った基本的なページ遷移の実装方法を教えて', d: 3 },
        { t: 'ルーティング設計', n: '複数ページを持つアプリのルーティング設計の考え方を教えて', d: 4 },
        { t: 'データフェッチ戦略', n: 'コンポーネント内でAPIデータを取得する際の設計パターンを教えて', d: 4 },
        { t: 'グローバルstate設計', n: 'アプリ全体で共有するグローバルなstateの設計方法を教えて', d: 4 },
      ]},
      { title: '第6章・コンポーネント設計', lessons: [
        { t: 'コンポーネント分割の指針', n: 'コンポーネントを適切な粒度に分割するための考え方を教えて', d: 3 },
        { t: 'コンポジションパターン', n: 'propsのchildrenを使ったコンポジションパターンの書き方を教えて', d: 4 },
        { t: 'HOCとレンダープロップス', n: '高階コンポーネント(HOC)とレンダープロップスパターンの使い方を教えて', d: 4 },
        { t: 'アクセシビリティ対応', n: 'Reactコンポーネントでアクセシビリティに配慮する基本的な方法を教えて', d: 3 },
        { t: 'テスト可能な設計', n: 'テストしやすいReactコンポーネントの設計方法を教えて', d: 4 },
      ]},
      { title: '第7章・実務スキル', lessons: [
        { t: 'フォームライブラリの活用', n: 'フォーム管理ライブラリを使った複雑なフォームの実装方法を教えて', d: 4 },
        { t: 'APIとの連携設計', n: 'バックエンドAPIと連携するReactアプリの設計パターンを教えて', d: 4 },
        { t: 'パフォーマンス計測', n: 'Reactアプリのパフォーマンスを計測・分析する方法を教えて', d: 4 },
        { t: 'デプロイと環境設定', n: 'Reactアプリを本番環境にデプロイする際の基本的な設定を教えて', d: 3 },
        { t: 'コードレビュー観点', n: 'Reactのコードをレビューする際に意識すべきポイントを教えて', d: 3 },
      ]},
      { title: '第8章・実践課題', lessons: [
        { t: 'ToDoアプリ制作', n: 'Reactでシンプルなtodoアプリを作る手順を教えて', d: 4 },
        { t: 'APIを使ったSPA制作', n: '外部APIと連携したSPAをReactで作る手順を教えて', d: 5 },
        { t: 'ダッシュボードアプリ制作', n: '複数のデータを可視化するダッシュボードアプリをReactで作る手順を教えて', d: 5 },
        { t: 'チャットアプリ制作', n: 'リアルタイム風のチャットUIをReactで作る手順を教えて', d: 5 },
        { t: '総合演習アプリ制作', n: 'これまで学んだReactの知識を総動員して、オリジナルのアプリを1つ設計・実装する手順を教えて', d: 5 },
      ]},
    ]),
  },
  {
    id: 'sql',
    name: 'SQL',
    kana: 'クエリの匠',
    icon: Database,
    from: '#2DD4BF',
    to: '#22C55E',
    timeXP: 14,
    difficulty: 1.45,
    titles: ['見習いクエリ職人', '独学のSQL使い', '実務級データベースエンジニア', '超エリート級データアーキテクト', 'データの創造神'],
    chapters: buildChapters(35, [
      { title: '第1章・SQL基礎', lessons: [
        { t: 'SELECT文の基本', n: 'SELECT文を使って特定のカラムやすべてのカラムを取得する基本的な書き方を教えて', d: 1 },
        { t: 'WHERE句による絞り込み', n: 'WHERE句を使って条件に合うレコードを絞り込む方法を教えて', d: 1 },
        { t: 'ORDER BYとLIMIT', n: 'ORDER BYで並び替え、LIMITで取得件数を制限する方法を教えて', d: 1 },
        { t: '比較演算子とNULL処理', n: '比較演算子やIS NULL/IS NOT NULLを使った条件指定の方法を教えて', d: 2 },
        { t: 'DISTINCTと重複排除', n: 'DISTINCTを使って重複した行を除いて取得する方法を教えて', d: 2 },
      ]},
      { title: '第2章・データの集計', lessons: [
        { t: 'GROUP BYの基本', n: 'GROUP BYを使ってデータをグループ化して集計する方法を教えて', d: 2 },
        { t: '集計関数(COUNT/SUM/AVG)', n: 'COUNT, SUM, AVG, MAX, MINなど代表的な集計関数の使い方を教えて', d: 2 },
        { t: 'HAVING句の使い方', n: 'HAVING句を使ってグループ化後の結果を絞り込む方法と、WHEREとの違いを教えて', d: 3 },
        { t: 'サブクエリの基本', n: 'SELECT文の中に別のSELECT文を書くサブクエリの基本的な使い方を教えて', d: 3 },
        { t: 'CASE式による条件分岐', n: 'CASE式を使ってSELECT結果に条件付きの値を出力する方法を教えて', d: 3 },
      ]},
      { title: '第3章・テーブル結合', lessons: [
        { t: 'INNER JOINの基本', n: 'INNER JOINを使って複数テーブルを結合してデータを取得する方法を教えて', d: 2 },
        { t: 'LEFT JOIN/RIGHT JOIN', n: 'LEFT JOINとRIGHT JOINの違いと、それぞれの使いどころを教えて', d: 3 },
        { t: '複数テーブルの結合', n: '3つ以上のテーブルを結合してデータを取得する方法を教えて', d: 3 },
        { t: '自己結合(self join)', n: '同じテーブル同士を結合する自己結合(self join)の使い方と用途を教えて', d: 4 },
        { t: 'UNIONによる結果の結合', n: 'UNIONとUNION ALLを使って複数のSELECT結果を結合する方法を教えて', d: 3 },
      ]},
      { title: '第4章・テーブル設計とデータ型', lessons: [
        { t: 'テーブル設計の基本', n: 'CREATE TABLEを使ったテーブル設計の基本的な考え方を教えて', d: 2 },
        { t: '主キーと外部キー', n: '主キー(PRIMARY KEY)と外部キー(FOREIGN KEY)の役割と設定方法を教えて', d: 3 },
        { t: '正規化の考え方', n: 'データベース設計における正規化(第1〜第3正規形)の考え方を教えて', d: 4 },
        { t: 'インデックスの基本', n: 'インデックスの仕組みと、検索を高速化するための基本的な使い方を教えて', d: 4 },
        { t: '制約(NOT NULL/UNIQUE等)', n: 'NOT NULL, UNIQUE, CHECKなどテーブルに設定できる制約の種類と使い方を教えて', d: 3 },
      ]},
      { title: '第5章・データの操作(更新系)', lessons: [
        { t: 'INSERT文の基本', n: 'INSERT文を使って新しいレコードを追加する方法を教えて', d: 2 },
        { t: 'UPDATE文の基本', n: 'UPDATE文を使って既存レコードを更新する方法と、WHERE句の重要性を教えて', d: 2 },
        { t: 'DELETE文の基本', n: 'DELETE文を使ってレコードを削除する方法と、安全に削除するための注意点を教えて', d: 2 },
        { t: 'トランザクションの基本', n: 'トランザクション(COMMIT/ROLLBACK)の基本的な考え方と使いどころを教えて', d: 4 },
        { t: 'UPSERT的な処理', n: '存在すれば更新、なければ挿入するUPSERT的な処理の実装方法を教えて', d: 4 },
      ]},
      { title: '第6章・実務でよく使うテクニック', lessons: [
        { t: 'ウィンドウ関数の基本', n: 'OVER句を使ったウィンドウ関数の基本的な考え方と使い方を教えて', d: 4 },
        { t: 'ランキング関数(RANK等)', n: 'RANK, DENSE_RANK, ROW_NUMBERなどランキング関数の違いと使い方を教えて', d: 4 },
        { t: '日付・時刻関数', n: '日付や時刻を扱うための代表的なSQL関数の使い方を教えて', d: 3 },
        { t: '文字列操作関数', n: '文字列の結合・抽出・置換など代表的な文字列操作関数の使い方を教えて', d: 3 },
        { t: 'CTE(WITH句)の活用', n: 'WITH句を使ったCTE(共通テーブル式)でクエリを整理する方法を教えて', d: 4 },
      ]},
      { title: '第7章・パフォーマンスと運用', lessons: [
        { t: '実行計画の読み方', n: 'EXPLAINを使ってクエリの実行計画を確認し、読み解く基本を教えて', d: 4 },
        { t: 'インデックス設計の最適化', n: '実務でのインデックス設計における最適化の考え方を教えて', d: 5 },
        { t: 'N+1問題への対処', n: 'アプリ開発で起こりがちなN+1問題の原因と、SQLでの対処方法を教えて', d: 4 },
        { t: 'ビュー(VIEW)の活用', n: 'VIEWを作成してよく使うクエリを再利用する方法を教えて', d: 3 },
        { t: '権限管理の基本', n: 'GRANT/REVOKEを使ったデータベースのユーザー権限管理の基本を教えて', d: 3 },
      ]},
      { title: '第8章・実践課題', lessons: [
        { t: 'ECサイトの売上集計クエリ作成', n: 'ECサイトを想定した注文データから、商品別・月別の売上を集計するクエリを設計する手順を教えて', d: 4 },
        { t: '会員データベースの設計', n: '会員情報を管理するためのテーブル設計(正規化を含む)を行う手順を教えて', d: 4 },
        { t: 'ダッシュボード用の集計クエリ制作', n: '管理画面のダッシュボードで使うような複数指標を集計するクエリを設計する手順を教えて', d: 5 },
        { t: 'パフォーマンスチューニング演習', n: '遅いクエリを分析し、インデックスやクエリ書き換えで改善する演習の進め方を教えて', d: 5 },
        { t: '総合演習(小規模DB設計〜分析)', n: 'これまで学んだSQLの知識を総動員して、小規模なデータベースの設計からデータ分析までを行う手順を教えて', d: 5 },
      ]},
    ]),
  },
];

// tier: min到達レベル / キー / 表示ラベル / メダルのグラデーション3色 [明,中,暗]
const TIERS = [
  { min: 100, key: 'legendary', label: '伝説', colors: ['#FF7DA6', '#FFD34D', '#7A1FFF'], glow: true },
  { min: 50, key: 'platinum', label: 'プラチナ', colors: ['#D6FBFB', '#7EE8E8', '#2F5FB0'] },
  { min: 25, key: 'gold', label: 'ゴールド', colors: ['#FFE9A8', '#FFD34D', '#B9791F'] },
  { min: 10, key: 'silver', label: 'シルバー', colors: ['#F3F5FA', '#C7CCD8', '#6F7691'] },
  { min: 1, key: 'bronze', label: 'ブロンズ', colors: ['#E8B27E', '#CD8B4A', '#6B3F1C'] },
];
const TIERS_ASC = [...TIERS].reverse(); // [bronze, silver, gold, platinum, legendary]

function getTier(level) {
  return TIERS.find((t) => level >= t.min) || TIERS[TIERS.length - 1];
}
function getTierTitle(course, tier) {
  return course.titles[TIERS_ASC.findIndex((t) => t.key === tier.key)];
}

// 全レッスンを完了した時点(タイムログ無し)で各コースが「ゴールド」帯の入口(Lv.25)前後に届くよう調整
const CURVE_K = 0.71627;
function xpForStep(level, difficulty) {
  return Math.round(CURVE_K * Math.pow(level, 1.55) * difficulty);
}

function getLevelInfo(totalXP, difficulty) {
  let level = 1;
  let remaining = totalXP;
  let need = xpForStep(level, difficulty);
  let guard = 0;
  while (remaining >= need && guard < 400) {
    remaining -= need;
    level += 1;
    need = xpForStep(level, difficulty);
    guard += 1;
  }
  return { level, currentXP: remaining, need, progress: Math.min(1, remaining / need) };
}

function emptyProgress() {
  const p = {};
  COURSES.forEach((c) => {
    p[c.id] = { completed: [], timeLogCount: 0 };
  });
  return p;
}

function emptyProfile() {
  return { username: '', iconId: 'default', title: null };
}

const ICON_ORDER = ['default', 'bronze', 'silver', 'gold', 'platinum', 'legendary'];
function iconUnlocked(iconId, progress) {
  if (iconId === 'default') return true;
  const tier = TIERS.find((t) => t.key === iconId);
  if (!tier) return false;
  return COURSES.some((c) => getLevelInfo(courseXP(c, progress[c.id]), c.difficulty).level >= tier.min);
}
function earnedTitles(progress) {
  const list = [];
  COURSES.forEach((course) => {
    const level = getLevelInfo(courseXP(course, progress[course.id]), course.difficulty).level;
    TIERS_ASC.forEach((tier, i) => {
      if (level >= tier.min) {
        list.push({ key: `${course.id}-${tier.key}`, courseName: course.name, courseColor: course.from, tierKey: tier.key, tierLabel: tier.label, title: course.titles[i] });
      }
    });
  });
  return list;
}
// 称号の文字色は、その称号が属するバッジ(ティア)の色に寄せる
const TIER_TEXT_COLOR = {
  bronze: '#E4AE79',
  silver: '#DDE2EE',
  gold: '#FFD34D',
  platinum: '#8FF0F0',
};
const LEGENDARY_TEXT_GRADIENT = 'linear-gradient(90deg, #FF9EC0, #FFD34D, #B98CFF)';
function findTitleTierKey(titleText) {
  if (!titleText) return null;
  for (const course of COURSES) {
    const idx = course.titles.indexOf(titleText);
    if (idx !== -1) return TIERS_ASC[idx].key;
  }
  return null;
}
function titleTextStyle(tierKey) {
  if (!tierKey) return { color: '#F3F1FF' };
  if (tierKey === 'legendary') {
    return { backgroundImage: LEGENDARY_TEXT_GRADIENT, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
  }
  return { color: TIER_TEXT_COLOR[tierKey] || '#F3F1FF' };
}

function totalLessonXP(course, completed) {
  return completed.reduce((sum, lid) => {
    const parts = lid.split('-');
    const ci = parseInt(parts[1], 10);
    const li = parseInt(parts[2], 10);
    const lesson = course.chapters[ci] && course.chapters[ci].lessons[li];
    return sum + (lesson ? lesson.xp : 0);
  }, 0);
}

function courseXP(course, progress) {
  return totalLessonXP(course, progress.completed) + progress.timeLogCount * course.timeXP;
}

function formatStudyTime(timeLogCount) {
  const totalMinutes = timeLogCount * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

/* ------------------------------------------------------------------ */
/* メダル(バッジ)グラフィック                                            */
/* ------------------------------------------------------------------ */

function Medal({ tier, uid, size = 46 }) {
  const gradId = `mg-${tier.key}-${uid}`;
  const glowId = `mgl-${tier.key}-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 68" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={tier.colors[0]} />
          <stop offset="55%" stopColor={tier.colors[1]} />
          <stop offset="100%" stopColor={tier.colors[2]} />
        </linearGradient>
        {tier.glow && (
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <path d="M23 38 L14 62 L25 56 L29 42 Z" fill={tier.colors[2]} opacity="0.9" />
      <path d="M41 38 L50 62 L39 56 L35 42 Z" fill={tier.colors[2]} opacity="0.9" />
      <circle cx="32" cy="27" r="25" fill={`url(#${gradId})`} stroke={tier.colors[2]} strokeWidth="2" filter={tier.glow ? `url(#${glowId})` : undefined} />
      <circle cx="32" cy="27" r="19" fill="none" stroke="#ffffff66" strokeWidth="1.3" />
      <path
        d="M32 14 L35.6 23 L45 23.6 L37.7 29.7 L40.2 39 L32 33.6 L23.8 39 L26.3 29.7 L19 23.6 L28.4 23 Z"
        fill="#ffffffdd"
      />
    </svg>
  );
}

function LockedMedal({ size = 46 }) {
  return (
    <div className="medal-locked" style={{ width: size, height: size }}>
      <span>?</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UIサブコンポーネント                                                 */
/* ------------------------------------------------------------------ */

function XPBar({ progress, from, to, segments = 10 }) {
  return (
    <div className="xpbar-track">
      <div
        className="xpbar-fill"
        style={{ width: `${progress * 100}%`, background: `linear-gradient(90deg, ${from}, ${to})` }}
      />
      <div className="xpbar-ticks">
        {Array.from({ length: segments - 1 }).map((_, i) => (
          <span key={i} className="xpbar-tick" />
        ))}
      </div>
    </div>
  );
}

function DifficultyStars({ rating, size = 10 }) {
  return (
    <span className="diff-stars" title={DIFF_LABEL[rating]}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? DIFF_COLOR[rating] : 'none'}
          color={i < rating ? DIFF_COLOR[rating] : '#3A3F5C'}
        />
      ))}
    </span>
  );
}

function CourseCard({ course, xp, onOpen }) {
  const info = getLevelInfo(xp, course.difficulty);
  const tier = getTier(info.level);
  const Icon = course.icon;

  return (
    <button className={`course-card ${tier.key === 'legendary' ? 'is-legendary' : ''}`} onClick={onOpen}>
      <div className="course-card-glow" style={{ background: `radial-gradient(circle at 30% 20%, ${course.from}33, transparent 60%)` }} />
      <div className="course-card-top">
        <div className="course-icon" style={{ background: `linear-gradient(135deg, ${course.from}, ${course.to})` }}>
          <Icon size={22} color="#0D0F1A" strokeWidth={2.4} />
        </div>
        <div className="course-tier-badge" title={tier.label}>
          <Medal tier={tier} uid={`card-${course.id}`} size={26} />
          <span className="tier-label">{tier.label}</span>
        </div>
      </div>

      <div className="course-name">{course.name}</div>
      <div className="course-title">{getTierTitle(course, tier)}</div>

      <div className="course-level-row">
        <span className="level-pixel">Lv.{info.level}</span>
      </div>

      <XPBar progress={info.progress} from={course.from} to={course.to} />
      <div className="xp-caption">
        {info.currentXP} / {info.need} XP
      </div>

      <div className="course-card-cta">
        詳細を見る <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
      </div>
    </button>
  );
}

function LessonRow({ lesson, done, onToggle, accent, copied, onCopy }) {
  return (
    <div className={`lesson-row ${done ? 'is-done' : ''}`}>
      <button className="lesson-toggle" onClick={onToggle}>
        <span className="lesson-check" style={done ? { color: accent } : undefined}>
          {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
        </span>
        <span className="lesson-label">{lesson.title}</span>
        <DifficultyStars rating={lesson.difficulty} />
        <span className="lesson-xp">+{lesson.xp}XP</span>
      </button>
      <div className="lesson-note-row">
        <p className="lesson-note">{lesson.note}</p>
        <button className="copy-chip" onClick={onCopy}>
          <Copy size={12} /> {copied ? 'コピーしました' : 'プロンプトをコピー'}
        </button>
      </div>
    </div>
  );
}

function CourseDetail({ course, progress, onToggleLesson, onLogTime, onReset, onClose }) {
  const [openChapter, setOpenChapter] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const copyTimer = useRef(null);
  const xp = courseXP(course, progress);
  const info = getLevelInfo(xp, course.difficulty);
  const tier = getTier(info.level);
  const Icon = course.icon;
  const totalLessons = course.chapters.reduce((s, c) => s + c.lessons.length, 0);

  function handleCopy(lid, text) {
    copyText(text);
    clearTimeout(copyTimer.current);
    setCopiedId(lid);
    copyTimer.current = setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
        {/* スクロールしても常に見えるレベル/XP情報 */}
        <div className="detail-sticky">
          <button className="detail-close" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
          <div className="detail-header">
            <div className="detail-icon" style={{ background: `linear-gradient(135deg, ${course.from}, ${course.to})` }}>
              <Icon size={26} color="#0D0F1A" strokeWidth={2.4} />
            </div>
            <div>
              <div className="detail-kana">{course.kana}</div>
              <div className="detail-name">{course.name}</div>
            </div>
            <div className="detail-tier">
              <Medal tier={tier} uid={`detail-${course.id}`} size={40} />
              <span className="detail-tier-label">{tier.label}</span>
            </div>
          </div>
          <div className="detail-stats">
            <div className="detail-level">Lv.{info.level}</div>
            <div className="detail-title">「{getTierTitle(course, tier)}」</div>
          </div>
          <XPBar progress={info.progress} from={course.from} to={course.to} segments={20} />
          <div className="xp-caption">次のレベルまで {info.need - info.currentXP} XP</div>
        </div>

        <div className="detail-summary">
          <div>完了レッスン &nbsp;<b>{progress.completed.length}</b> / {totalLessons}</div>
          <button className="timelog-btn" style={{ borderColor: course.from }} onClick={onLogTime}>
            <Clock size={14} /> 30分学習を記録（+{course.timeXP}XP）
          </button>
        </div>

        <div className="detail-reset-row">
          {resetConfirm ? (
            <>
              <span className="reset-confirm-text">本当にこのコースの進捗をリセットしますか？</span>
              <button className="reset-yes-btn" onClick={() => { onReset(); setResetConfirm(false); }}>はい、リセットする</button>
              <button className="reset-cancel-btn" onClick={() => setResetConfirm(false)}>キャンセル</button>
            </>
          ) : (
            <button className="reset-btn" onClick={() => setResetConfirm(true)}>
              <RotateCcw size={12} /> このコースをリセット
            </button>
          )}
        </div>

        <div className="chapters">
          {course.chapters.map((chapter, ci) => {
            const chapterDone = chapter.lessons.filter((_, li) => progress.completed.includes(`${course.id}-${ci}-${li}`)).length;
            const avgDiff = Math.max(1, Math.min(5, Math.round(chapter.lessons.reduce((s, l) => s + l.difficulty, 0) / chapter.lessons.length)));
            return (
              <div className="chapter" key={ci}>
                <button className="chapter-head" onClick={() => setOpenChapter(openChapter === ci ? -1 : ci)}>
                  <ChevronDown size={16} style={{ transform: openChapter === ci ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s' }} />
                  <span className="chapter-title">{chapter.title}</span>
                  <span className="chapter-diff-chip" style={{ color: DIFF_COLOR[avgDiff], borderColor: DIFF_COLOR[avgDiff] }}>
                    {DIFF_LABEL[avgDiff]}
                  </span>
                  <span className="chapter-progress">{chapterDone}/{chapter.lessons.length}</span>
                </button>
                {openChapter === ci && (
                  <div className="chapter-body">
                    {chapter.lessons.map((lesson, li) => {
                      const lid = `${course.id}-${ci}-${li}`;
                      return (
                        <LessonRow
                          key={lid}
                          lesson={lesson}
                          done={progress.completed.includes(lid)}
                          accent={course.from}
                          onToggle={() => onToggleLesson(lid)}
                          copied={copiedId === lid}
                          onCopy={() => handleCopy(lid, lesson.note)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LevelUpToast({ toast }) {
  if (!toast) return null;
  return (
    <div className="levelup-toast">
      <Sparkles size={18} />
      <span>
        <b>{toast.name}</b> が Lv.{toast.to} に到達！
      </span>
    </div>
  );
}

function Avatar({ iconId, size = 56 }) {
  if (iconId === 'default' || !iconId) {
    return (
      <div className="avatar-default" style={{ width: size, height: size }}>
        <UserRound size={Math.round(size * 0.5)} color="#8B8FAE" strokeWidth={2} />
      </div>
    );
  }
  const tier = TIERS.find((t) => t.key === iconId);
  if (!tier) return <div className="avatar-default" style={{ width: size, height: size }} />;
  return <Medal tier={tier} uid={`avatar-${iconId}`} size={size} />;
}

function ProfileCard({ profile, progress, onUpdateProfile }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.username);
  const [activeEditor, setActiveEditor] = useState(null); // null | 'icon' | 'title'

  const totalMinutes = COURSES.reduce((s, c) => s + progress[c.id].timeLogCount * 30, 0);

  function commitName() {
    onUpdateProfile({ username: nameDraft.trim().slice(0, 20) });
    setEditingName(false);
  }

  function toggleEditor(key) {
    setActiveEditor((cur) => (cur === key ? null : key));
  }

  const titles = earnedTitles(progress);
  const titleTierKey = findTitleTierKey(profile.title);

  return (
    <div className="profile-card-main">
      <div className="profile-card-main-top">
        <div className="avatar-wrap">
          <Avatar iconId={profile.iconId} size={60} />
        </div>

        <div className="profile-card-main-body">
          {editingName ? (
            <input
              className="username-input"
              autoFocus
              value={nameDraft}
              placeholder="名前を入力"
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') { setNameDraft(profile.username); setEditingName(false); } }}
            />
          ) : (
            <button className="username-display" onClick={() => { setNameDraft(profile.username); setEditingName(true); }}>
              {profile.username ? profile.username : '名前を設定'}
              <Pencil size={12} />
            </button>
          )}

          <div className="title-display" style={titleTextStyle(titleTierKey)}>
            {profile.title ? `「${profile.title}」` : '称号未設定'}
          </div>

          <div className="profile-card-main-time"><Clock size={12} /> 合計学習時間 {formatStudyTime(totalMinutes / 30)}</div>
        </div>
      </div>

      <div className="editor-tabs">
        <button className={`editor-tab ${activeEditor === 'icon' ? 'is-active' : ''}`} onClick={() => toggleEditor('icon')}>
          アイコン編集
        </button>
        <button className={`editor-tab ${activeEditor === 'title' ? 'is-active' : ''}`} onClick={() => toggleEditor('title')}>
          称号編集
        </button>
      </div>

      <div className="editor-scrollbox">
        {activeEditor === null && (
          <div className="editor-placeholder">上のタブから編集したい項目を選んでください</div>
        )}

        {activeEditor === 'icon' && (
          <div className="icon-grid">
            {ICON_ORDER.map((id) => {
              const unlocked = iconUnlocked(id, progress);
              const tier = TIERS.find((t) => t.key === id);
              const note = id === 'default' ? '最初から使用可能' : `いずれかのコースでLv.${tier.min}到達で解放（${tier.label}バッジ初獲得）`;
              return (
                <button
                  key={id}
                  className={`icon-option ${unlocked ? '' : 'is-locked'} ${profile.iconId === id ? 'is-selected' : ''}`}
                  disabled={!unlocked}
                  onClick={() => onUpdateProfile({ iconId: id })}
                  title={note}
                >
                  <div className="icon-option-avatar">
                    <Avatar iconId={id} size={44} />
                    {!unlocked && <span className="icon-lock-overlay"><Lock size={16} /></span>}
                    {profile.iconId === id && <span className="icon-selected-mark"><Check size={12} /></span>}
                  </div>
                  <span className="icon-option-note">{note}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeEditor === 'title' && (
          titles.length === 0 ? (
            <p className="picker-empty">まだ称号を獲得していません。各コースのレッスンを進めてバッジを獲得すると、その称号を選べるようになります。</p>
          ) : (
            <div className="title-list">
              <button className={`title-option ${!profile.title ? 'is-selected' : ''}`} onClick={() => onUpdateProfile({ title: null })}>
                未設定にする
              </button>
              {titles.map((t) => (
                <button
                  key={t.key}
                  className={`title-option ${profile.title === t.title ? 'is-selected' : ''}`}
                  onClick={() => onUpdateProfile({ title: t.title })}
                >
                  <span className="title-option-dot" style={{ background: t.courseColor }} />
                  <span className="title-option-text" style={titleTextStyle(t.tierKey)}>{t.title}</span>
                  <span className="title-option-meta">{t.courseName}・{t.tierLabel}</span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function ProfileScreen({ progress, profile, onUpdateProfile }) {
  return (
    <div className="profile-screen">
      <ProfileCard profile={profile} progress={progress} onUpdateProfile={onUpdateProfile} />

      <div className="profile-cards">
        {COURSES.map((course) => {
          const p = progress[course.id];
          const xp = courseXP(course, p);
          const info = getLevelInfo(xp, course.difficulty);
          const tier = getTier(info.level);
          const Icon = course.icon;
          return (
            <div className="profile-card" key={course.id}>
              <div className="profile-card-top">
                <div className="profile-card-icon" style={{ background: `linear-gradient(135deg, ${course.from}, ${course.to})` }}>
                  <Icon size={20} color="#0D0F1A" strokeWidth={2.4} />
                </div>
                <div className="profile-card-body">
                  <div className="profile-card-name">{course.name}</div>
                  <div className="profile-card-level">Lv.{info.level} <span className="profile-card-tier">{tier.label}・{getTierTitle(course, tier)}</span></div>
                  <div className="profile-card-time"><Clock size={12} /> {formatStudyTime(p.timeLogCount)}</div>
                </div>
                <Medal tier={tier} uid={`profile-${course.id}`} size={34} />
              </div>
              <XPBar progress={info.progress} from={course.from} to={course.to} segments={16} />
              <div className="profile-card-xpline">
                <span>{info.currentXP} / {info.need} XP</span>
                <span>次のLvまで残り {info.need - info.currentXP} XP</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="badge-dex-head">
        <div className="hero-eyebrow">Badge Collection</div>
        <div className="badge-dex-title">バッジ図鑑</div>
        <p className="badge-dex-sub">レベルが上がるごとに称号バッジを獲得。未獲得は点線のシルエットで表示されます。</p>
      </div>

      <div className="badge-dex">
        {COURSES.map((course) => {
          const p = progress[course.id];
          const xp = courseXP(course, p);
          const info = getLevelInfo(xp, course.difficulty);
          const Icon = course.icon;
          return (
            <div className="badge-dex-row" key={course.id}>
              <div className="badge-dex-course">
                <Icon size={16} />
                <span>{course.name}</span>
              </div>
              <div className="badge-dex-items">
                {TIERS_ASC.map((tier, i) => {
                  const earned = info.level >= tier.min;
                  return (
                    <div className={`badge-item ${earned ? 'is-earned' : 'is-locked'}`} key={tier.key}>
                      {earned ? <Medal tier={tier} uid={`dex-${course.id}`} size={46} /> : <LockedMedal size={46} />}
                      <div className="badge-item-label">{earned ? course.titles[i] : `Lv.${tier.min}〜`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* メインアプリ                                                        */
/* ------------------------------------------------------------------ */

export default function SkillQuest() {
  const [progress, setProgress] = useState(emptyProgress());
  const [profile, setProfile] = useState(emptyProfile());
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'profile'
  const [resetAllConfirm, setResetAllConfirm] = useState(false);
  const [backupMsg, setBackupMsg] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toastTimer = useRef(null);
  const backupMsgTimer = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = loadLocal('skill-quest-progress');
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setProgress({ ...emptyProgress(), ...parsed });
        }
      } catch (e) {
        // 初回はキーが存在しないので何もしない
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        saveLocal('skill-quest-progress', JSON.stringify(progress));
      } catch (e) {
        console.error('保存に失敗しました', e);
      }
    })();
  }, [progress, loaded]);

  useEffect(() => {
    (async () => {
      try {
        const res = loadLocal('skill-quest-profile');
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setProfile({ ...emptyProfile(), ...parsed });
        }
      } catch (e) {
        // 初回はキーが存在しないので何もしない
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!profileLoaded) return;
    (async () => {
      try {
        saveLocal('skill-quest-profile', JSON.stringify(profile));
      } catch (e) {
        console.error('プロフィールの保存に失敗しました', e);
      }
    })();
  }, [profile, profileLoaded]);

  function updateProfile(partial) {
    setProfile((prev) => ({ ...prev, ...partial }));
  }

  function fireLevelUp(course, oldXP, newXP) {
    const before = getLevelInfo(oldXP, course.difficulty).level;
    const after = getLevelInfo(newXP, course.difficulty).level;
    if (after > before) {
      clearTimeout(toastTimer.current);
      setToast({ name: course.name, from: before, to: after });
      toastTimer.current = setTimeout(() => setToast(null), 3200);
    }
  }

  function toggleLesson(course, lid) {
    setProgress((prev) => {
      const cur = prev[course.id];
      const has = cur.completed.includes(lid);
      const oldXP = courseXP(course, cur);
      const nextCompleted = has ? cur.completed.filter((x) => x !== lid) : [...cur.completed, lid];
      const newXP = totalLessonXP(course, nextCompleted) + cur.timeLogCount * course.timeXP;
      if (!has) fireLevelUp(course, oldXP, newXP);
      return { ...prev, [course.id]: { ...cur, completed: nextCompleted } };
    });
  }

  function logTime(course) {
    setProgress((prev) => {
      const cur = prev[course.id];
      const oldXP = courseXP(course, cur);
      const newTimeLogCount = cur.timeLogCount + 1;
      const newXP = totalLessonXP(course, cur.completed) + newTimeLogCount * course.timeXP;
      fireLevelUp(course, oldXP, newXP);
      return { ...prev, [course.id]: { ...cur, timeLogCount: newTimeLogCount } };
    });
  }

  function resetCourse(course) {
    setProgress((prev) => ({ ...prev, [course.id]: { completed: [], timeLogCount: 0 } }));
  }

  function resetAll() {
    setProgress(emptyProgress());
  }

  function flashBackupMsg(text) {
    clearTimeout(backupMsgTimer.current);
    setBackupMsg(text);
    backupMsgTimer.current = setTimeout(() => setBackupMsg(null), 2500);
  }

  function applyLoadedData(text) {
    try {
      const parsed = JSON.parse(text);
      // 新形式 { progress, profile } と、旧形式(進捗のみ)の両方に対応
      if (parsed && parsed.progress) {
        setProgress({ ...emptyProgress(), ...parsed.progress });
        setProfile({ ...emptyProfile(), ...(parsed.profile || {}) });
      } else {
        setProgress({ ...emptyProgress(), ...parsed });
      }
      flashBackupMsg('読み込みました');
    } catch (e) {
      flashBackupMsg('ファイルの読み込みに失敗しました');
    }
  }

  function saveProgress() {
    const data = JSON.stringify({ progress, profile }, null, 2);
    downloadJSON(data, 'skill-quest-backup.json');
    flashBackupMsg('ダウンロードしました');
  }

  function loadProgress() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleFileInputChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => applyLoadedData(String(reader.result));
    reader.readAsText(file);
    e.target.value = '';
  }

  const activeCourse = COURSES.find((c) => c.id === activeId);
  const totalLevels = COURSES.reduce((sum, c) => sum + getLevelInfo(courseXP(c, progress[c.id]), c.difficulty).level, 0);
  const totalLessonsDone = COURSES.reduce((s, c) => s + progress[c.id].completed.length, 0);

  return (
    <div className="app-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

        * { box-sizing: border-box; }
        .app-root {
          min-height: 100%;
          background:
            radial-gradient(circle at 15% 0%, #1b1f3a 0%, transparent 45%),
            radial-gradient(circle at 85% 10%, #241b3a 0%, transparent 40%),
            #0D0F1A;
          color: #F3F1FF;
          font-family: 'Space Grotesk', sans-serif;
          padding: 32px 20px 80px;
        }
        .sidebar-toggle {
          position: fixed; top: 16px; left: 16px; z-index: 60; background: #171A2B; border: 1px solid #2A2E48;
          color: #F3F1FF; border-radius: 10px; padding: 9px; cursor: pointer; display: flex;
        }
        .sidebar-toggle:hover { border-color: #454B70; }
        .sidebar-backdrop { position: fixed; inset: 0; background: #05060Bcc; backdrop-filter: blur(2px); z-index: 55; }
        .sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; width: min(78vw, 250px); background: #14162A;
          border-right: 1px solid #2A2E48; z-index: 56; transform: translateX(-100%); transition: transform .2s ease;
          display: flex; flex-direction: column; padding: 20px 14px; overflow-y: auto;
        }
        .sidebar.is-open { transform: translateX(0); }
        .sidebar-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 0 4px; }
        .sidebar-title { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .2em; color: #8B8FAE; }
        .sidebar-close { background: none; border: none; color: #A9ADCB; cursor: pointer; padding: 4px; display: flex; }
        .sidebar-nav { display: flex; flex-direction: column; gap: 4px; }
        .sidebar-item {
          display: flex; align-items: center; gap: 10px; background: none; border: none; color: #C9CCE6;
          font-family: inherit; font-size: 13px; padding: 11px 12px; border-radius: 10px; cursor: pointer; text-align: left;
        }
        .sidebar-item:hover { background: #1F2338; }
        .sidebar-item.is-active { background: linear-gradient(90deg,#FF7A45,#B36BFF); color: #0D0F1A; font-weight: 700; }
        .sidebar-item-danger { color: #ff8fa3; }
        .sidebar-divider { height: 1px; background: #21243a; margin: 10px 4px; }
        .sidebar-msg { font-size: 11px; color: #7CD992; padding: 2px 12px 6px; }
        .sidebar-reset-confirm { padding: 8px 12px; font-size: 12px; color: #ff8fa3; display: flex; flex-direction: column; gap: 8px; }
        .sidebar-reset-actions { display: flex; gap: 8px; }
        .sidebar-danger-btn {
          background: #3a1420; border: 1px solid #6b2438; color: #ff8fa3; border-radius: 999px;
          padding: 6px 12px; font-size: 11px; cursor: pointer; font-family: inherit;
        }
        .sidebar-cancel-btn {
          background: none; border: 1px solid #2A2E48; color: #A9ADCB; border-radius: 999px;
          padding: 6px 12px; font-size: 11px; cursor: pointer; font-family: inherit;
        }

        .hero {
          max-width: 980px;
          margin: 0 auto 36px;
          text-align: center;
        }
        .hero-eyebrow {
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.25em;
          font-size: 11px;
          color: #8B8FAE;
          text-transform: uppercase;
        }
        .hero-title {
          font-family: 'Press Start 2P', monospace;
          font-size: 26px;
          line-height: 1.6;
          margin: 14px 0 10px;
          background: linear-gradient(90deg, #FF7A45, #FFD23F, #4D8DFF, #B36BFF);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-sub { color: #A9ADCB; font-size: 14px; max-width: 560px; margin: 0 auto; }
        .hero-stats {
          display: flex; gap: 18px; justify-content: center; margin-top: 22px; flex-wrap: wrap;
        }
        .hero-stat {
          background: #171A2B; border: 1px solid #2A2E48; border-radius: 12px;
          padding: 10px 18px; font-family: 'JetBrains Mono', monospace;
        }
        .hero-stat b { display:block; font-size: 18px; color: #FFD23F; }
        .hero-stat span { font-size: 11px; color: #8B8FAE; }

        .grid {
          max-width: 980px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px;
        }
        @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }

        .course-card {
          position: relative; overflow: hidden; text-align: left;
          background: #171A2B; border: 1px solid #2A2E48; border-radius: 18px;
          padding: 20px; cursor: pointer; color: inherit; font-family: inherit;
          transition: transform .15s ease, border-color .15s ease;
        }
        .course-card:hover { transform: translateY(-3px); border-color: #454B70; }
        .course-card.is-legendary { border-color: #FFD34D; box-shadow: 0 0 0 1px #FFD34D33, 0 0 24px #FF3D6E22; }
        .course-card-glow { position: absolute; inset: 0; pointer-events: none; }
        .course-card-top { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
        .course-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .course-tier-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #A9ADCB; }
        .course-name { font-size: 20px; font-weight: 700; margin-top: 14px; position: relative; z-index: 1; }
        .course-title { font-size: 12px; color: #8B8FAE; margin-top: 2px; position: relative; z-index: 1; }
        .course-level-row { margin: 14px 0 8px; position: relative; z-index: 1; }
        .level-pixel { font-family: 'Press Start 2P', monospace; font-size: 20px; }
        .xp-caption { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8B8FAE; margin-top: 6px; }
        .course-card-cta { margin-top: 16px; font-size: 12px; color: #C9CCE6; display: flex; align-items: center; gap: 4px; position: relative; z-index: 1; }

        .xpbar-track {
          position: relative; height: 12px; border-radius: 999px; background: #0D0F1A;
          border: 1px solid #2A2E48; overflow: hidden;
        }
        .xpbar-fill { height: 100%; border-radius: 999px; transition: width .35s ease; }
        .xpbar-ticks { position: absolute; inset: 0; display: flex; }
        .xpbar-tick { flex: 1; border-right: 1px solid #0D0F1A55; }

        .detail-overlay {
          position: fixed; inset: 0; background: #05060Bcc; backdrop-filter: blur(3px);
          display: flex; align-items: flex-end; justify-content: center; z-index: 50;
          padding: 0;
        }
        .detail-panel {
          width: 100%; max-width: 620px; max-height: 88vh; overflow-y: auto;
          border-top: 1px solid #2A2E48;
          border-radius: 22px 22px 0 0; padding: 0 22px 40px; position: relative;
          background-color: #14162A;
          animation: slideUp .22s ease;
        }
        @keyframes slideUp { from { transform: translateY(24px); opacity:0; } to { transform: translateY(0); opacity:1; } }
        .detail-sticky {
          position: sticky; top: 0; z-index: 20; background: #14162A;
          padding: 22px 0 14px; margin-bottom: 4px;
          border-bottom: 1px solid #21243a;
        }
        .detail-close { position: absolute; top: 16px; right: 0; background: #1F2338; border: 1px solid #2A2E48; border-radius: 8px; color: #F3F1FF; padding: 6px; cursor: pointer; }
        .detail-header { display: flex; align-items: center; gap: 14px; margin-top: 4px; padding-right: 40px; }
        .detail-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .detail-kana { font-size: 11px; color: #8B8FAE; }
        .detail-name { font-size: 22px; font-weight: 700; }
        .detail-tier { margin-left: auto; text-align: center; }
        .detail-tier-label { font-size: 10px; color: #8B8FAE; display: block; margin-top: 2px; }
        .detail-stats { display: flex; align-items: baseline; gap: 10px; margin: 16px 0 10px; }
        .detail-level { font-family: 'Press Start 2P', monospace; font-size: 22px; }
        .detail-title { color: #A9ADCB; font-size: 13px; }
        .detail-summary { display: flex; align-items: center; justify-content: space-between; margin: 16px 0 8px; font-size: 13px; color: #C9CCE6; flex-wrap: wrap; gap: 10px; }
        .timelog-btn {
          display: inline-flex; align-items: center; gap: 6px; background: #1B1E2B; color: #F3F1FF;
          border: 1px solid; border-radius: 999px; padding: 8px 14px; font-size: 12px; cursor: pointer;
        }
        .timelog-btn:hover { filter: brightness(1.15); }

        .detail-reset-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; }
        .reset-btn {
          display: inline-flex; align-items: center; gap: 5px; background: none; border: none;
          color: #6b7094; font-family: inherit; font-size: 11px; cursor: pointer; padding: 4px 2px;
        }
        .reset-btn:hover { color: #ff8fa3; }
        .reset-confirm-text { font-size: 11px; color: #ff8fa3; }
        .reset-yes-btn {
          background: #3a1420; border: 1px solid #6b2438; color: #ff8fa3; border-radius: 999px;
          padding: 4px 10px; font-size: 11px; cursor: pointer; font-family: inherit;
        }
        .reset-cancel-btn {
          background: none; border: 1px solid #2A2E48; color: #A9ADCB; border-radius: 999px;
          padding: 4px 10px; font-size: 11px; cursor: pointer; font-family: inherit;
        }

        .chapters { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
        .chapter { background: #171A2B; border: 1px solid #2A2E48; border-radius: 12px; overflow: hidden; }
        .chapter-head { width: 100%; display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: none; border: none; color: inherit; font-family: inherit; cursor: pointer; text-align: left; }
        .chapter-title { flex: 1; font-size: 13px; font-weight: 600; }
        .chapter-diff-chip { font-size: 10px; border: 1px solid; border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
        .chapter-progress { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8B8FAE; }
        .chapter-body { border-top: 1px solid #2A2E48; padding: 6px; display: flex; flex-direction: column; gap: 2px; }

        .lesson-row { display: flex; flex-direction: column; gap: 4px; padding: 8px 10px; border-radius: 8px; }
        .lesson-row:hover { background: #1F2338; }
        .lesson-toggle {
          display: flex; align-items: center; gap: 10px; padding: 0; background: none; border: none;
          color: inherit; font-family: inherit; cursor: pointer; text-align: left; font-size: 13px;
        }
        .lesson-row.is-done .lesson-label { color: #8B8FAE; text-decoration: line-through; }
        .lesson-check { color: #4A4F70; display: flex; flex-shrink: 0; }
        .lesson-label { flex: 1; }
        .diff-stars { display: flex; gap: 1px; flex-shrink: 0; }
        .lesson-xp { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8B8FAE; flex-shrink: 0; }
        .lesson-note-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; padding-left: 28px; }
        .lesson-note { font-size: 11px; color: #767ba0; line-height: 1.5; margin: 0; flex: 1; }
        .copy-chip {
          display: flex; align-items: center; gap: 4px; background: #1B1E2B; border: 1px solid #2A2E48;
          color: #A9ADCB; border-radius: 999px; padding: 3px 9px; font-size: 10px; cursor: pointer;
          flex-shrink: 0; white-space: nowrap; font-family: inherit;
        }
        .copy-chip:hover { border-color: #454B70; color: #fff; }

        .levelup-toast {
          position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
          background: linear-gradient(90deg, #1B1E2B, #241b3a); border: 1px solid #FFD34D;
          color: #FFD34D; padding: 12px 20px; border-radius: 999px; font-size: 13px;
          display: flex; align-items: center; gap: 8px; z-index: 100; box-shadow: 0 8px 30px #00000066;
          animation: toastIn .25s ease;
        }
        @keyframes toastIn { from { opacity:0; transform: translate(-50%,-12px); } to { opacity:1; transform: translate(-50%,0); } }

        /* メダル(ロック時) */
        .medal-locked {
          border-radius: 999px; border: 2px dashed #3A3F5C; display: flex; align-items: center; justify-content: center;
          color: #4A4F70; font-family: 'JetBrains Mono', monospace; font-size: 16px;
        }

        /* プロフィール画面 */
        .profile-screen { max-width: 720px; margin: 0 auto; }

        .profile-card-main { background: #171A2B; border: 1px solid #2A2E48; border-radius: 18px; padding: 20px; margin-bottom: 22px; }
        .profile-card-main-top { display: flex; align-items: center; gap: 16px; }
        .avatar-wrap { flex-shrink: 0; }
        .avatar-default {
          border-radius: 999px; background: linear-gradient(135deg, #3A3F5C, #1F2338);
          border: 2px solid #2A2E48; display: flex; align-items: center; justify-content: center;
        }
        .profile-card-main-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
        .username-display {
          display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: #F3F1FF;
          font-family: inherit; font-size: 16px; font-weight: 700; cursor: pointer; padding: 0;
          text-shadow: 0 1px 3px rgba(0,0,0,0.55);
        }
        .username-display:hover { color: #FFD34D; }
        .username-input {
          background: #0D0F1A; border: 1px solid #454B70; border-radius: 8px; color: #F3F1FF;
          font-family: inherit; font-size: 15px; padding: 5px 9px; width: 180px;
        }
        .title-display {
          font-family: inherit; font-size: 12px; font-weight: 600; text-align: left;
          text-shadow: 0 1px 3px rgba(0,0,0,0.55);
        }
        .profile-card-main-time {
          font-size: 11px; color: #C9CCE6; display: flex; align-items: center; gap: 5px; margin-top: 2px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .editor-tabs { display: flex; gap: 8px; margin-top: 18px; flex-wrap: wrap; }
        .editor-tab {
          flex: 1; min-width: 100px; background: #14162A; border: 1px solid #2A2E48; color: #A9ADCB;
          font-family: inherit; font-size: 12px; border-radius: 999px; padding: 8px 10px; cursor: pointer;
        }
        .editor-tab:hover { border-color: #454B70; color: #fff; }
        .editor-tab.is-active { background: linear-gradient(90deg,#FF7A45,#B36BFF); color: #0D0F1A; border-color: transparent; font-weight: 700; }

        .editor-scrollbox {
          margin-top: 12px; height: 260px; overflow-y: auto; background: #0D0F1A55;
          border: 1px solid #21243a; border-radius: 12px; padding: 14px;
        }
        .editor-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 12px; color: #6b7094; padding: 0 20px; }
        .picker-empty { font-size: 12px; color: #8B8FAE; line-height: 1.6; }

        .icon-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        @media (max-width: 480px) { .icon-grid { grid-template-columns: repeat(2, 1fr); } }
        .icon-option {
          display: flex; flex-direction: column; align-items: center; gap: 6px; background: #171A2B;
          border: 1px solid #2A2E48; border-radius: 12px; padding: 10px 6px; cursor: pointer;
        }
        .icon-option.is-selected { border-color: #FFD34D; }
        .icon-option.is-locked { cursor: not-allowed; opacity: 0.55; }
        .icon-option-avatar { position: relative; }
        .icon-lock-overlay {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: #0D0F1Ab3; border-radius: 999px; color: #A9ADCB;
        }
        .icon-selected-mark {
          position: absolute; bottom: -2px; right: -2px; background: #FFD34D; color: #0D0F1A;
          border-radius: 999px; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;
        }
        .icon-option-note { font-size: 9px; color: #8B8FAE; line-height: 1.4; text-align: center; }

        .title-list { display: flex; flex-direction: column; gap: 6px; }
        .title-option {
          display: flex; align-items: center; gap: 8px; background: #171A2B; border: 1px solid #2A2E48;
          border-radius: 10px; padding: 9px 12px; cursor: pointer; color: #C9CCE6; font-family: inherit;
          font-size: 12px; text-align: left;
        }
        .title-option.is-selected { border-color: #FFD34D; }
        .title-option-dot { width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0; }
        .title-option-text { flex: 1; font-weight: 600; }
        .title-option-meta { font-size: 10px; color: #8B8FAE; flex-shrink: 0; }

        .backup-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
        .backup-btn {
          display: inline-flex; align-items: center; gap: 6px; background: #171A2B; border: 1px solid #2A2E48;
          color: #C9CCE6; border-radius: 999px; padding: 7px 14px; font-size: 12px; cursor: pointer; font-family: inherit;
        }
        .backup-btn:hover { border-color: #454B70; color: #fff; }
        .backup-msg { font-size: 11px; color: #7CD992; }

        .profile-cards { display: flex; flex-direction: column; gap: 12px; margin-bottom: 46px; }
        .profile-card { background: #171A2B; border: 1px solid #2A2E48; border-radius: 14px; padding: 16px; }
        .profile-card-top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .profile-card-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .profile-card-body { flex: 1; min-width: 0; }
        .profile-card-name { font-size: 14px; font-weight: 700; }
        .profile-card-level { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #C9CCE6; margin-top: 2px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .profile-card-tier { color: #8B8FAE; font-family: 'Space Grotesk', sans-serif; }
        .profile-card-time { font-size: 11px; color: #8B8FAE; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
        .profile-card-xpline { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #8B8FAE; margin-top: 6px; }

        .badge-dex-head { text-align: center; margin-bottom: 20px; }
        .badge-dex-title { font-family: 'Press Start 2P', monospace; font-size: 18px; margin: 10px 0 8px; }
        .badge-dex-sub { font-size: 12px; color: #8B8FAE; max-width: 420px; margin: 0 auto; }

        .badge-dex { display: flex; flex-direction: column; gap: 18px; }
        .badge-dex-row { background: #14162A; border: 1px solid #2A2E48; border-radius: 16px; padding: 16px; }
        .badge-dex-course { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; margin-bottom: 12px; color: #C9CCE6; }
        .badge-dex-items { display: flex; justify-content: space-between; gap: 6px; flex-wrap: wrap; }
        .badge-item { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 66px; }
        .badge-item-label { font-size: 9px; text-align: center; color: #8B8FAE; line-height: 1.3; }
        .badge-item.is-earned .badge-item-label { color: #C9CCE6; }

        @media (prefers-reduced-motion: reduce) {
          .course-card, .xpbar-fill, .detail-panel, .levelup-toast { animation: none !important; transition: none !important; }
        }
      `}</style>

      <button className="sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)} aria-label="メニューを開く">
        <Menu size={20} />
      </button>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <span className="sidebar-title">MENU</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="メニューを閉じる">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-item ${view === 'profile' ? 'is-active' : ''}`} onClick={() => { setView('profile'); setSidebarOpen(false); }}>
            <UserRound size={16} /> プロフィール
          </button>
          <button className={`sidebar-item ${view === 'dashboard' ? 'is-active' : ''}`} onClick={() => { setView('dashboard'); setSidebarOpen(false); }}>
            <LayoutGrid size={16} /> クエスト
          </button>

          <div className="sidebar-divider" />

          <button className="sidebar-item" onClick={saveProgress}>
            <Download size={16} /> セーブ
          </button>
          <button className="sidebar-item" onClick={loadProgress}>
            <Upload size={16} /> ロード
          </button>
          {backupMsg && <div className="sidebar-msg">{backupMsg}</div>}

          <div className="sidebar-divider" />

          {resetAllConfirm ? (
            <div className="sidebar-reset-confirm">
              <span>本当にリセットしますか？</span>
              <div className="sidebar-reset-actions">
                <button className="sidebar-danger-btn" onClick={() => { resetAll(); setResetAllConfirm(false); }}>はい</button>
                <button className="sidebar-cancel-btn" onClick={() => setResetAllConfirm(false)}>キャンセル</button>
              </div>
            </div>
          ) : (
            <button className="sidebar-item sidebar-item-danger" onClick={() => setResetAllConfirm(true)}>
              <RotateCcw size={16} /> 全リセット
            </button>
          )}
        </nav>
      </aside>

      {view === 'dashboard' && (
        <>
          <div className="hero">
            <div className="hero-eyebrow">Personal Skill Tracker</div>
            <div className="hero-title">SKILL QUEST</div>
            <p className="hero-sub">5つの言語コースをそれぞれレベルアップさせよう。全レッスン完了でゴールドバッジ、Lv.100は上位1%の「伝説」の領域。</p>
            <div className="hero-stats">
              <div className="hero-stat"><b>{totalLessonsDone}</b><span>完了レッスン</span></div>
              <div className="hero-stat"><b>{COURSES.length}</b><span>挑戦中のコース</span></div>
              <div className="hero-stat"><b>{totalLevels}</b><span>合計レベル</span></div>
            </div>
          </div>

          <div className="grid">
            {COURSES.map((course) => (
              <CourseCard key={course.id} course={course} xp={courseXP(course, progress[course.id])} onOpen={() => setActiveId(course.id)} />
            ))}
          </div>
        </>
      )}
      {view === 'profile' && (
        <ProfileScreen progress={progress} profile={profile} onUpdateProfile={updateProfile} />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {activeCourse && (
        <CourseDetail
          course={activeCourse}
          progress={progress[activeCourse.id]}
          onToggleLesson={(lid) => toggleLesson(activeCourse, lid)}
          onLogTime={() => logTime(activeCourse)}
          onReset={() => resetCourse(activeCourse)}
          onClose={() => setActiveId(null)}
        />
      )}

      <LevelUpToast toast={toast} />
    </div>
  );
}