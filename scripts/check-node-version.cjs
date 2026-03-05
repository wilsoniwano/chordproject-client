const [major, minor] = process.versions.node
    .split('.')
    .map((part) => Number.parseInt(part, 10));

if (major !== 20 || minor < 19) {
    console.error(
        `\n[Node version error] Este projeto exige Node 20.19+ para compatibilidade com Angular 21.\n` +
            `Versão detectada: ${process.versions.node}\n` +
            `Use: nvm install 20.19.0 && nvm use 20.19.0\n`
    );
    process.exit(1);
}
