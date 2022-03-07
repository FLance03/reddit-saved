
import {stemmer} from 'stemmer';

// function test() {
//     let a = editDistance('librewolf', 'https://librewolf.net/docs/features/');
//     console.log(a)
//     console.log(a / 'hors'.length)
//     // console.log(a.next());
//     // console.log(a.next());
//     // console.log(a.next());
//     // console.log(a.next());
// }
// test();

export async function search(query, candidates) {
    query = query.split(' ');
    candidates = candidates.map((candidate) => candidate.split(' '));
    // queryWordsMatches[i][j] is true iff the ith candidate (starting 0) passes the jth word in the query
    let candidatesMatches = new Array(candidates.length).fill(0)
                                                        .map(() => new Array(query.length).fill(false));
    // matchCounts is an array where each element gives the number of matches for each word in the query
    let matchCounts = new Array(query.length).fill(0);
    for (let [qWordIndex, queryWord] of query.entries()) {
        for (let [cIndex, candidate] of candidates.entries()) {
            for (let candidateWord of candidate) {
                let threshold = 0.5;
                queryWord = queryWord.replace(/\W/g, '').toLowerCase();
                candidateWord = candidateWord.replace(/\W/g, '').toLowerCase();
                let wordScore = editDistance(queryWord, candidateWord);
                if (wordScore/queryWord.length < threshold) {
                    // Passes threshold and accept
                // console.log(queryWord, candidateWord, wordScore, wordScore/queryWord.length);
                //     console.log(wordScore/queryWord.length, queryWord, candidateWord);
                    candidatesMatches[cIndex][qWordIndex] = true;
                    matchCounts[qWordIndex]++;
                }
            }
        }
    }

    let matchInfoContent = matchCounts.map(count => count != 0 ? Math.log2(candidates.filter(candidate => candidate.length > 0)
                                                                                        .length / count) : 0);
    // candidatesScores is an array of objects: {score, word count of candidate, index of candidate}
    // that have a non-zero score
    let candidatesScores = await candidatesMatches.map((candidate, index) => {
        let scores = candidate.map((match, index) => match ? matchInfoContent[index] : 0);
        let sumScores = scores.reduce((partialSum, infoContent) => partialSum + infoContent, 0);
        return {score: sumScores, wordCount: candidates[index].length, index: index};
    }).filter(candidate => candidate.score > 0);
    // console.log(matchInfoContent)
    // console.log(candidatesMatches)
    // console.log(candidatesScores)

    let maxHeapScores = maxHeapify(candidatesScores);
    { // For asserting no repeating elements in heap
        let includedCandidates = new Array(candidates.length).fill(false);
        for (let {index} of maxHeapScores) {
            console.assert(!includedCandidates[index], "duplicate found");
            includedCandidates[index] = true;
        }
        console.assert(JSON.stringify(candidatesScores.map(candidate => candidate.index).sort()) ==
                        JSON.stringify(maxHeapScores.map(candidate => candidate.index).sort())
            , JSON.stringify(candidatesScores.map(candidate => candidate.index).sort()), 
            JSON.stringify(maxHeapScores.map(candidate => candidate.index).sort()));
    }

    return getHighestScore(maxHeapScores);
}

function maxHeapify(arr) {
    for (let root=Math.floor(arr.length/2)-1 ; root >= 0 ; root--) {
        sift(arr, root);
    }
    return arr;
}

function* getHighestScore(heap) {
    while (heap.length > 0){
        // console.log(heap.length)
        let top = heap[0];
        yield top;
        heap[0] = heap[heap.length - 1];
        heap.pop();
        sift(heap, 0);
    }
}

function sift(heap, index) {
    if (index >= heap.length) {
        return;
    }
    let parent = index, currentScore = heap[index];
    for (let child=parent*2 + 1 ; child<heap.length ; ) {
        // Check score but if equal check wordCount
        if (child + 1 < heap.length && 
            (heap[child + 1].score >  heap[child].score ||
             heap[child + 1].score ==  heap[child].score && 
             heap[child + 1].wordCount <  heap[child].wordCount)){
            child++;
        }
        if (heap[child].score > currentScore.score ||
            heap[child].score == currentScore.score &&
            heap[child].wordCount < currentScore.wordCount) {
            heap[parent] = heap[child];
            parent = child;
            child = child * 2 + 1;
        }else {
            break;
        }
    }
    heap[parent] = currentScore;
}

function editDistance(A, B) {
    let Wd = 1, Wi = 1, Wc = 2, Ws = 1;
    let maxDistance = A.length * Wd + B.length * Wi + 1;

    let H = new Array(A.length + 1).fill(0).map(() => new Array(B.length + 1));
    for (let i=0 ; i <= A.length ; i++) {
        H[i][0] = i * Wd;
    }
    for (let j=0 ; j <= B.length ; j++) {
        // H[0][j] = j * Wi;
        H[0][j] = 0;
    }

    let DA = new Array(256).fill(-1);

    for (let i=0 ; i < A.length ; i++) {
        let DB = -1;
        for (let j=0 ; j < B.length ; j++) {
            let i1 = DA[asciiToIndex(B[j])];
            let j1 = DB;
            let cost = Wc;
            if (A[i] == B[j]) {
                cost = 0;
                DB = j;
            }
            H[i+1][j+1] = Math.min(H[i][j] + cost, H[i+1][j] + Wi, H[i][j+1] + Wd,
            i1 == -1 || j1 == -1 ? maxDistance : H[i1][j1] + Ws + (i - i1 - 1) * Wd + (j - j1 - 1) * Wi);
        }
        DA[asciiToIndex(A[i])] = i;
    }
    // return H[A.length][B.length];
    // B may start anywhere (e.g. for A="abc", B="https://abc.com")
    return Math.min(...H[A.length]);
}

// function alphanumToIndex(char) {
//     let code = char.charCodeAt();
//     return code < 58 ? code - 48 : code - 97 + 10;
// }

function asciiToIndex(char) {
    return char.charCodeAt();
}

export function stemSentences(string) {
    return string.split(" ").map(word => stemmer(word)).join(" ");
}