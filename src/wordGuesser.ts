export default async function wordGuesser(canvasString: string) {
    console.log(canvasString);
    return new Promise<string>((resolve, reject) => {
        setTimeout(() => {
            resolve('Ahmed');
        }, 1000);
    });
}