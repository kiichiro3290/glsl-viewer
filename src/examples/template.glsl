precision mediump float;

uniform float uTime;
uniform vec2 uResolution;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    gl_FragColor = vec4(uv, abs(sin(uTime)), 1.0);
}
