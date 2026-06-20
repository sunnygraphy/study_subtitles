import json
import os
import shutil

def apply_patches_to_file(file_path, patches):
    """지정된 파일 하나에 여러 패치를 적용합니다."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ '{file_path}' 파일을 찾을 수 없습니다. 건너뜁니다.")
        return False

    original_content = content
    successful_patches = 0
    
    print(f"\n📄 '{file_path}' 파일 업데이트 중...")

    for i, patch in enumerate(patches):
        old_code = patch['old_code']
        new_code = patch['new_code']

        # strip()을 사용하여 앞뒤 공백/줄바꿈 차이를 무시하고 비교
        if old_code.strip() in content:
            # 원본 content에서 old_code와 정확히 일치하는 부분을 찾아 교체
            # (들여쓰기 등 공백 유지를 위해 strip() 안 쓴 버전으로 교체)
            content = content.replace(old_code, new_code, 1)
            print(f"  ✅ 패치 #{i+1} 적용 완료.")
            successful_patches += 1
        else:
            print(f"  ⚠️ 패치 #{i+1} 적용 실패: 교체할 코드를 찾지 못했습니다. (이미 수정된 파일일 수 있습니다)")

    if original_content != content:
        # 백업 파일 생성
        backup_path = file_path + ".bak"
        shutil.copy(file_path, backup_path)
        print(f"  ↪ 원본 파일을 '{backup_path}'(으)로 백업했습니다.")

        # 원본 파일 덮어쓰기
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✨ '{file_path}' 파일이 성공적으로 업데이트되었습니다.")
        return True
    else:
        print(f"  ℹ️ '{file_path}' 파일에 적용할 새로운 변경 사항이 없습니다.")
        return False

def main():
    """patches.json을 읽어 모든 파일에 대한 패치를 순차적으로 적용합니다."""
    patch_config_file = "patches.json"

    print("="*50)
    print("🚀 범용 코드 자동 업데이트 도구를 시작합니다.")
    print("="*50)

    if not os.path.exists(patch_config_file):
        print(f"오류: '{patch_config_file}' 파일이 없습니다. AI에게 패치 파일을 요청하세요.")
        return

    with open(patch_config_file, 'r', encoding='utf-8') as f:
        try:
            all_patch_sets = json.load(f)
        except json.JSONDecodeError:
            print(f"오류: '{patch_config_file}'의 형식이 올바른 JSON이 아닙니다.")
            return

    if not all_patch_sets:
        print("ℹ️ 적용할 패치가 없습니다. 'patches.json' 파일이 비어 있습니다.")
        return

    total_files_changed = 0
    for patch_set in all_patch_sets:
        target_file = patch_set.get("target_file")
        patches = patch_set.get("patches")

        if not target_file or not patches:
            print("⚠️ 'target_file' 또는 'patches' 정보가 없는 세트가 있어 건너뜁니다.")
            continue
        
        if apply_patches_to_file(target_file, patches):
            total_files_changed += 1
    
    print("\n" + "="*50)
    if total_files_changed > 0:
        print(f"🎉 총 {total_files_changed}개의 파일이 업데이트되었습니다. 작업을 마칩니다.")
    else:
        print("✅ 모든 작업이 완료되었지만, 변경된 파일은 없습니다.")
    print("="*50)

if __name__ == "__main__":
    main()
