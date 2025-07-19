import type React from "react"
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import Feather from "react-native-vector-icons/Feather"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"


interface ProfileImage {
    url: string
}

interface EmailVerification {
    isVerified: boolean
}

interface PhoneNumber {
    isVerified: boolean
}

interface UserData {
    name?: string
    email?: string
    phone?: string
    profileImage?: ProfileImage
    emailVerification?: EmailVerification
    phoneNumber?: PhoneNumber
}

interface User {
    data?: UserData
}

interface ProfileHeaderProps {
    user?: User
    onLogout?: () => void
    onHelp?: () => void

}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onLogout, navigation }) => {
    const profileInfo = user?.data || {}


    const getInitials = (name?: string): string => {
        if (!name) return "U"
        return name.charAt(0).toUpperCase()
    }
    const handleLogout = (): void => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            {
                text: "Cancel",
                style: "cancel",
            },
            {
                text: "Logout",
                onPress: () => {
                    onLogout();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                },
                style: "destructive",
            },
        ]);
    };



    return (
        <View style={styles.container}>
            {/* Main Profile Card */}
            <View style={styles.profileCard}>
                {/* Profile Badge Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profileBadgeContainer}>
                        <View style={styles.profileBadge}>
                            <Text style={styles.profileBadgeText}>{getInitials(profileInfo?.name)}</Text>
                        </View>
                        {/* Online Status */}
                        <View style={styles.onlineStatus} />

                    </View>
                    <Text style={styles.userName}>{profileInfo?.name || "User Name"}</Text>
                </View>

                {/* User Information */}
                <View style={styles.userInfoSection}>
                    <View style={styles.userDetails}>

                        <View style={styles.contactInfo}>
                            <View style={styles.contactRow}>
                                <View style={styles.iconWrapper}>
                                    <Feather name="phone" size={moderateScale(14)} color="#64748B" />
                                </View>
                                <Text style={styles.contactText}>{profileInfo?.phone || "Enter Your Phone Number"}</Text>
                            </View>

                            {profileInfo?.email && (
                                <View style={styles.contactRow}>
                                    <View style={styles.iconWrapper}>
                                        <Feather name="mail" size={moderateScale(14)} color="#64748B" />
                                    </View>
                                    <Text style={styles.contactText}>{profileInfo.email}</Text>

                                </View>
                            )}
                        </View>
                    </View>
                </View>


                <View style={styles.actionsSection}>

                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.8}>
                        <MaterialIcons name="logout" size={moderateScale(18)} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>


        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
        backgroundColor: "#FAFBFC",
        paddingTop: verticalScale(8),
        paddingBottom: verticalScale(8),
        paddingHorizontal: scale(8),
        gap: verticalScale(12),
    },

    // Main Profile Card
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: moderateScale(8),
        padding: scale(14),
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F1F5F9",
    },

    // Profile Badge Section
    profileSection: {
        marginRight: scale(16),
    },
    profileBadgeContainer: {
        position: "relative",
    },
    profileBadge: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(32),
        backgroundColor: "#6366F1",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#6366F1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    profileBadgeText: {
        fontSize: moderateScale(24),
        fontWeight: "700",
        color: "#FFFFFF",
        textAlign: "center",
    },
    onlineStatus: {
        position: "absolute",
        bottom: scale(2),
        right: scale(2),
        width: scale(8),
        height: scale(8),
        backgroundColor: "#10B981",
        borderRadius: scale(8),
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },

    // User Info Section
    userInfoSection: {
        flex: 1,
        marginRight: scale(12),
    },
    userDetails: {
        gap: verticalScale(8),
    },
    userName: {
        marginLeft: scale(5),
        fontSize: moderateScale(12),
        fontWeight: "700",
        color: "#1E293B",
        textTransform: "capitalize",
    },
    contactInfo: {
        gap: verticalScale(2),
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: scale(8),
    },
    iconWrapper: {
        width: scale(24),
        height: scale(24),
        borderRadius: scale(12),
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
    },
    contactText: {
        fontSize: moderateScale(12),
        color: "#64748B",
        flex: 1,
        fontWeight: "500",
    },
    verifiedBadge: {
        width: scale(16),
        height: scale(16),
        borderRadius: scale(8),
        backgroundColor: "#DCFCE7",
        alignItems: "center",
        justifyContent: "center",
    },

    // Actions Section
    actionsSection: {
        gap: verticalScale(8),
    },
    helpButton: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(22),
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    logoutButton: {
        width: scale(44),
        height: scale(44),
        borderRadius: scale(22),
        backgroundColor: "#FEF2F2",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#FECACA",
    },


})

export default ProfileHeader
