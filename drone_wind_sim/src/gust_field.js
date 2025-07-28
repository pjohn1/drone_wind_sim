class GustField {
    constructor(numWaves = 5, seed = 42) {
      this.numWaves = numWaves;
      this.freqs = [];
      this.amps = [];
      this.ks = [];
      this.phases = [];
      this.random = this.seededRandom(seed);
  
      for (let i = 0; i < numWaves; i++) {
        this.freqs.push(this.randomRange(0.1, 1.0));
        this.amps.push([
          this.randomRange(0.2, 0.5),
          this.randomRange(0.2, 0.5),
          this.randomRange(0.2, 0.5),
        ]);
        this.ks.push([
          this.randomRange(-5.0, 5.0),
          this.randomRange(-5.0, 5.0),
          this.randomRange(-5.0, 5.0),
        ]);
        this.phases.push(this.randomRange(0, 2 * Math.PI));
      }
    }
  
    // Evaluate gust vector at position [x, y, z] and time t
    evaluate(r, t,amp) {
      let v = [0, 0, 0];
      for (let i = 0; i < this.numWaves; i++) {
        let kDotR = this.ks[i][0] * r[0] + this.ks[i][1] * r[1] + this.ks[i][2] * r[2];
        let phase = 2 * Math.PI * this.freqs[i] * t + kDotR + this.phases[i];
        v[0] += amp[0] * Math.sin(phase);
        v[1] += amp[1] * Math.sin(phase);
        v[2] += amp[2] * Math.sin(phase);
      }
      return v;
    }
  
    // Utility: random number generator with seed
    seededRandom(seed) {
      let x = Math.sin(seed) * 10000;
      return function () {
        x = Math.sin(x) * 10000;
        return x - Math.floor(x);
      };
    }
  
    randomRange(min, max) {
      return min + (max - min) * this.random();
    }
  }
  
  export default GustField;