import SwiftUI
import AVFoundation
import UniformTypeIdentifiers

struct MusicTrack: Codable, Identifiable {
    let id: String
    let title: String
    let artist: String
    let fileName: String
    var isFavorite: Bool
}

struct MusicView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var tab = "main"
    @State private var tracks: [MusicTrack] = []
    @State private var showPicker = false
    @State private var audioPlayer: AVAudioPlayer?
    @State private var playing: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                tabBar
                if tab == "favorites" {
                    listView(filterFavorites)
                } else {
                    listView(filterAll)
                }
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    Text("Музыка")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(theme.textPrimary)
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showPicker = true }) {
                        Image(systemName: "plus")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(Color(hex: "#6C63FF"))
                    }
                }
            }
            .toolbarBackground(Color.clear, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .fileImporter(isPresented: $showPicker, allowedContentTypes: [.mp3, .wav, .audio, .mpeg4Audio]) { result in
                if case .success(let url) = result { importTrack(url) }
            }
            .onAppear { loadTracks() }
        }
        .tint(Color(hex: "#6C63FF"))
    }

    private var tabBar: some View {
        HStack(spacing: 4) {
            ForEach([("main", "Главная"), ("favorites", "Избранное"), ("downloads", "Загрузки")], id: \.0) { id, title in
                Button(action: { withAnimation(.easeInOut(duration: 0.2)) { tab = id } }) {
                    Text(title)
                        .font(.system(size: 14, weight: tab == id ? .semibold : .regular))
                        .foregroundColor(tab == id ? theme.textPrimary : theme.textSecondary)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(
                            tab == id
                                ? RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.1))
                                : nil
                        )
                }.buttonStyle(.plain)
            }
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.white.opacity(0.06))
        )
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }

    private var filterAll: [MusicTrack] { tracks }
    private var filterFavorites: [MusicTrack] { tracks.filter { $0.isFavorite } }

    private func listView(_ list: [MusicTrack]) -> some View {
        Group {
            if list.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "music.note.list")
                            .font(.system(size: 48))
                            .foregroundColor(theme.textSecondary.opacity(0.5))
                        Text("Нет треков")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundColor(theme.textSecondary)
                    }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 2) {
                        ForEach(list) { track in
                            Button(action: { playTrack(track) }) {
                                HStack(spacing: 12) {
                                    ZStack {
                                        Circle()
                                            .fill(Color.white.opacity(0.1))
                                            .frame(width: 48, height: 8)
                                        if playing == track.id {
                                            Image(systemName: "speaker.wave.2.fill")
                                                .font(.system(size: 16))
                                                .foregroundColor(Color(hex: "#6C63FF"))
                                        } else {
                                            Image(systemName: "music.note")
                                                .font(.system(size: 16))
                                                .foregroundColor(theme.textSecondary)
                                        }
                                    }
                                    .frame(width: 48, height: 48)

                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(track.title)
                                            .font(.system(size: 16, weight: .medium))
                                            .foregroundColor(theme.textPrimary)
                                        Text(track.artist)
                                            .font(.system(size: 14))
                                            .foregroundColor(theme.textSecondary)
                                    }

                                    Spacer()

                                    Button(action: { toggleFavorite(track) }) {
                                        Image(systemName: track.isFavorite ? "heart.fill" : "heart")
                                            .font(.system(size: 18))
                                            .foregroundColor(track.isFavorite ? .red : theme.textSecondary)
                                    }.buttonStyle(.plain)
                                }
                                .padding(.vertical, 10)
                                .padding(.horizontal, 4)
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(playing == track.id ? Color.white.opacity(0.08) : Color.clear)
                                )
                            }.buttonStyle(.plain)
                        }
                    }.padding(.horizontal, 12)
                }
            }
        }
    }

    private func importTrack(_ url: URL) {
        guard url.startAccessingSecurityScopedResource() else { return }
        defer { url.stopAccessingSecurityScopedResource() }
        do {
            let data = try Data(contentsOf: url)
            let fileName = url.lastPathComponent
            let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
            let dest = docs.appendingPathComponent(fileName)
            try data.write(to: dest)
            let track = MusicTrack(
                id: UUID().uuidString,
                title: url.deletingPathExtension().lastPathComponent,
                artist: "Неизвестный",
                fileName: fileName,
                isFavorite: false
            )
            tracks.append(track)
            saveTracks()
        } catch { print(error) }
    }

    private func playTrack(_ track: MusicTrack) {
        if playing == track.id {
            audioPlayer?.stop()
            playing = nil
            return
        }
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let url = docs.appendingPathComponent(track.fileName)
        guard FileManager.default.fileExists(atPath: url.path) else { return }
        audioPlayer = try? AVAudioPlayer(contentsOf: url)
        audioPlayer?.play()
        playing = track.id
    }

    private func toggleFavorite(_ track: MusicTrack) {
        if let i = tracks.firstIndex(where: { $0.id == track.id }) {
            tracks[i].isFavorite.toggle()
            saveTracks()
        }
    }

    private func saveTracks() {
        if let data = try? JSONEncoder().encode(tracks) {
            UserDefaults.standard.set(data, forKey: "music_tracks")
        }
    }

    private func loadTracks() {
        if let data = UserDefaults.standard.data(forKey: "music_tracks"),
           let saved = try? JSONDecoder().decode([MusicTrack].self, from: data) {
            tracks = saved
        }
    }
}
